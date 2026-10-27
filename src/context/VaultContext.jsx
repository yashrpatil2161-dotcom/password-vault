import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  encryptData,
  decryptData,
  createVaultBackup,
  validateBackupFile,
} from '../services/crypto';
import {
  isVaultInitialized,
  saveEncryptedVault,
  getEncryptedVault,
  saveSettings,
  getSettings,
  clearVault,
} from '../services/storage';

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [credentials, setCredentials] = useState([]);
  const [settings, setSettingsState] = useState({
    autoLockMinutes: 15,
    defaultLength: 16,
    includeSymbols: true,
    includeNumbers: true,
    includeUppercase: true,
    includeLowercase: true,
  });
  const [toasts, setToasts] = useState([]);

  // Memory-only storage for current master password during active unlocked session
  const masterPasswordRef = useRef(null);
  const autoLockTimerRef = useRef(null);

  // Toast notification helper
  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Lock the vault immediately and clear secrets from memory
  const lockVault = useCallback(() => {
    masterPasswordRef.current = null;
    setCredentials([]);
    setIsLocked(true);
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
  }, []);

  // Activity timer for auto-lock
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }

    const minutes = Number(settings.autoLockMinutes);
    if (minutes > 0 && !isLocked && masterPasswordRef.current) {
      autoLockTimerRef.current = setTimeout(() => {
        lockVault();
        showToast('Vault locked automatically due to inactivity.', 'info');
      }, minutes * 60 * 1000);
    }
  }, [settings.autoLockMinutes, isLocked, lockVault, showToast]);

  // Listen to user interactions for idle detection when unlocked
  useEffect(() => {
    if (isLocked) return;

    resetAutoLockTimer();

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let lastRecorded = 0;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle event checks to every 3 seconds
      if (now - lastRecorded > 3000) {
        lastRecorded = now;
        resetAutoLockTimer();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
    };
  }, [isLocked, resetAutoLockTimer]);

  // Initial load check
  useEffect(() => {
    async function initCheck() {
      try {
        setLoading(true);
        const initialized = await isVaultInitialized();
        setIsInitialized(initialized);

        const loadedSettings = await getSettings();
        if (loadedSettings) {
          setSettingsState(loadedSettings);
        }
      } catch (err) {
        showToast('Error checking vault database: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    initCheck();
  }, [showToast]);

  // First-time setup: establish master password
  const setupVault = useCallback(async (masterPassword) => {
    if (!masterPassword || masterPassword.length < 8) {
      throw new Error('Master password must be at least 8 characters long.');
    }

    const payload = {
      credentials: [],
      canary: 'PASSWORD_VAULT_AUTHENTICATED',
      createdAt: new Date().toISOString(),
    };

    const encryptedPackage = await encryptData(payload, masterPassword);
    await saveEncryptedVault(encryptedPackage);

    masterPasswordRef.current = masterPassword;
    setCredentials([]);
    setIsInitialized(true);
    setIsLocked(false);
    showToast('Vault initialized and secured successfully!', 'success');
  }, [showToast]);

  // Unlock existing vault with master password
  const unlockVault = useCallback(async (masterPassword) => {
    if (!masterPassword) {
      throw new Error('Please enter your master password.');
    }

    const encryptedPackage = await getEncryptedVault();
    if (!encryptedPackage) {
      throw new Error('No vault data found. Please set up your vault.');
    }

    // Attempt decryption. Will throw if password is incorrect.
    const decrypted = await decryptData(encryptedPackage, masterPassword);

    if (!decrypted || !Array.isArray(decrypted.credentials)) {
      throw new Error('Vault data format is corrupted.');
    }

    masterPasswordRef.current = masterPassword;
    setCredentials(decrypted.credentials);
    setIsLocked(false);
    showToast('Vault unlocked successfully.', 'success');
  }, [showToast]);

  // Persist current credentials to IndexedDB using active master password
  const persistCredentials = useCallback(async (newCredentials) => {
    if (!masterPasswordRef.current) {
      throw new Error('Vault is locked. Cannot save changes.');
    }

    const payload = {
      credentials: newCredentials,
      canary: 'PASSWORD_VAULT_AUTHENTICATED',
      updatedAt: new Date().toISOString(),
    };

    const encryptedPackage = await encryptData(payload, masterPasswordRef.current);
    await saveEncryptedVault(encryptedPackage);
    setCredentials(newCredentials);
  }, []);

  // Add new credential
  const addCredential = useCallback(async (credentialData) => {
    const newItem = {
      id: 'cred_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      name: credentialData.name.trim(),
      url: credentialData.url ? credentialData.url.trim() : '',
      username: credentialData.username ? credentialData.username.trim() : '',
      password: credentialData.password || '',
      notes: credentialData.notes ? credentialData.notes.trim() : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...credentials];
    await persistCredentials(updated);
    showToast(`Saved credential for "${newItem.name}".`, 'success');
    return newItem;
  }, [credentials, persistCredentials, showToast]);

  // Update existing credential
  const updateCredential = useCallback(async (id, updatedFields) => {
    const itemIndex = credentials.findIndex((c) => c.id === id);
    if (itemIndex === -1) {
      throw new Error('Credential not found.');
    }

    const currentItem = credentials[itemIndex];
    const updatedItem = {
      ...currentItem,
      ...updatedFields,
      name: updatedFields.name !== undefined ? updatedFields.name.trim() : currentItem.name,
      url: updatedFields.url !== undefined ? updatedFields.url.trim() : currentItem.url,
      username: updatedFields.username !== undefined ? updatedFields.username.trim() : currentItem.username,
      notes: updatedFields.notes !== undefined ? updatedFields.notes.trim() : currentItem.notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [...credentials];
    updatedList[itemIndex] = updatedItem;

    await persistCredentials(updatedList);
    showToast(`Updated credential for "${updatedItem.name}".`, 'success');
    return updatedItem;
  }, [credentials, persistCredentials, showToast]);

  // Delete credential
  const deleteCredential = useCallback(async (id) => {
    const itemToDelete = credentials.find((c) => c.id === id);
    const updatedList = credentials.filter((c) => c.id !== id);
    await persistCredentials(updatedList);
    showToast(`Deleted "${itemToDelete?.name || 'credential'}".`, 'info');
  }, [credentials, persistCredentials, showToast]);

  // Export encrypted vault as JSON download
  const exportBackup = useCallback(async () => {
    const encryptedPackage = await getEncryptedVault();
    if (!encryptedPackage) {
      throw new Error('No vault data available to export.');
    }

    const backupPayload = createVaultBackup(encryptedPackage, {
      itemCount: credentials.length,
    });

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `password-vault-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Encrypted backup downloaded successfully.', 'success');
  }, [credentials.length, showToast]);

  // Import encrypted backup file
  const importBackup = useCallback(async (backupFileContent, backupMasterPassword) => {
    // 1. Validate structure without altering vault
    const parsed = validateBackupFile(backupFileContent);

    // 2. Decrypt backup payload with supplied master password
    let decryptedPayload;
    try {
      decryptedPayload = await decryptData(parsed.encryptedPackage, backupMasterPassword);
    } catch (err) {
      throw new Error('Failed to decrypt backup. Incorrect password or corrupted file.');
    }

    if (!decryptedPayload || !Array.isArray(decryptedPayload.credentials)) {
      throw new Error('Corrupted backup: credentials payload is missing or invalid.');
    }

    const importedCredentials = decryptedPayload.credentials;

    // 3. Re-encrypt under active master password if unlocked, or if not initialized set active
    const activePassword = masterPasswordRef.current || backupMasterPassword;
    masterPasswordRef.current = activePassword;

    const reEncrypted = await encryptData(
      {
        credentials: importedCredentials,
        canary: 'PASSWORD_VAULT_AUTHENTICATED',
        updatedAt: new Date().toISOString(),
      },
      activePassword
    );

    // 4. Safely save to IndexedDB only after everything above succeeded
    await saveEncryptedVault(reEncrypted);
    setCredentials(importedCredentials);
    setIsInitialized(true);
    setIsLocked(false);

    showToast(`Successfully restored ${importedCredentials.length} credentials from backup!`, 'success');
  }, [showToast]);

  // Change master password
  const changeMasterPassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new Error('Both current and new master passwords are required.');
    }

    if (newPassword.length < 8) {
      throw new Error('New master password must be at least 8 characters long.');
    }

    // Verify current master password against stored vault
    const encryptedPackage = await getEncryptedVault();
    const decrypted = await decryptData(encryptedPackage, currentPassword);

    // Re-encrypt with new password and fresh salt & IV
    const newEncrypted = await encryptData(decrypted, newPassword);
    await saveEncryptedVault(newEncrypted);

    masterPasswordRef.current = newPassword;
    showToast('Master password successfully changed!', 'success');
  }, [showToast]);

  // Update non-sensitive user settings
  const updateSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettingsState(merged);
    await saveSettings(merged);
    showToast('Settings updated.', 'success');
  }, [settings, showToast]);

  // Reset/wipe entire vault
  const resetVault = useCallback(async () => {
    await clearVault();
    masterPasswordRef.current = null;
    setCredentials([]);
    setIsInitialized(false);
    setIsLocked(true);
    showToast('Vault has been completely reset.', 'info');
  }, [showToast]);

  const value = {
    loading,
    isInitialized,
    isLocked,
    credentials,
    settings,
    toasts,
    showToast,
    removeToast,
    setupVault,
    unlockVault,
    lockVault,
    addCredential,
    updateCredential,
    deleteCredential,
    exportBackup,
    importBackup,
    changeMasterPassword,
    updateSettings,
    resetVault,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
