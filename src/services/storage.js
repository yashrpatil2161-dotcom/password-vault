/**
 * IndexedDB Storage Service
 * Stores only encrypted data and local settings.
 * Never stores plain text credentials or encryption keys.
 */

const DB_NAME = 'PasswordVaultDB';
const DB_VERSION = 1;
const STORE_VAULT = 'vault_data';
const STORE_SETTINGS = 'vault_settings';

const KEY_ENCRYPTED_VAULT = 'encrypted_vault';
const KEY_SETTINGS = 'settings';

function getIDBFactory() {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return window.indexedDB;
  }
  if (typeof globalThis !== 'undefined' && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  throw new Error('IndexedDB is not supported in this environment.');
}

/**
 * Open or upgrade the IndexedDB database
 */
export function openDB() {
  const idb = getIDBFactory();

  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_VAULT)) {
        db.createObjectStore(STORE_VAULT);
      }

      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(new Error('IndexedDB error: ' + (event.target.error?.message || 'Failed to open database')));
    };
  });
}

/**
 * Check whether a vault has already been set up
 */
export async function isVaultInitialized() {
  const data = await getEncryptedVault();
  return Boolean(data && data.ciphertext);
}

/**
 * Save the encrypted vault package
 */
export async function saveEncryptedVault(encryptedPackage) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_VAULT], 'readwrite');
      const store = tx.objectStore(STORE_VAULT);
      const req = store.put(encryptedPackage, KEY_ENCRYPTED_VAULT);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(new Error('Failed to save encrypted vault: ' + e.target.error?.message));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieve the encrypted vault package
 */
export async function getEncryptedVault() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_VAULT], 'readonly');
      const store = tx.objectStore(STORE_VAULT);
      const req = store.get(KEY_ENCRYPTED_VAULT);

      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = (e) => reject(new Error('Failed to read encrypted vault: ' + e.target.error?.message));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save user settings (e.g., autoLockMinutes)
 */
export async function saveSettings(settings) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_SETTINGS], 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.put(settings, KEY_SETTINGS);

      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(new Error('Failed to save settings: ' + e.target.error?.message));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieve user settings
 */
export async function getSettings() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_SETTINGS], 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get(KEY_SETTINGS);

      req.onsuccess = (e) => {
        resolve(e.target.result || {
          autoLockMinutes: 15,
          defaultLength: 16,
          includeSymbols: true,
          includeNumbers: true,
          includeUppercase: true,
          includeLowercase: true,
        });
      };
      req.onerror = (e) => reject(new Error('Failed to load settings: ' + e.target.error?.message));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete all vault data and reset IndexedDB stores
 */
export async function clearVault() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_VAULT, STORE_SETTINGS], 'readwrite');
      const vaultStore = tx.objectStore(STORE_VAULT);
      const settingsStore = tx.objectStore(STORE_SETTINGS);

      vaultStore.clear();
      settingsStore.clear();

      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(new Error('Failed to clear vault database: ' + e.target.error?.message));
    } catch (err) {
      reject(err);
    }
  });
}
