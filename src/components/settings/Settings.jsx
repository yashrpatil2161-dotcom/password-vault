import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Download,
  Upload,
  Lock,
  KeyRound,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export default function Settings() {
  const {
    settings,
    updateSettings,
    exportBackup,
    importBackup,
    changeMasterPassword,
    resetVault,
    showToast,
  } = useVault();

  // Auto-lock state
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings?.autoLockMinutes ?? 15);

  // Change Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [showPwFields, setShowPwFields] = useState(false);
  const [pwChangeError, setPwChangeError] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Import Backup state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Reset confirmation state
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleAutoLockChange = async (e) => {
    const val = Number(e.target.value);
    setAutoLockMinutes(val);
    await updateSettings({ autoLockMinutes: val });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwChangeError('');

    if (!currentPw || !newPw) {
      setPwChangeError('Please fill in all password fields.');
      return;
    }

    if (newPw.length < 8) {
      setPwChangeError('New master password must be at least 8 characters.');
      return;
    }

    if (newPw !== confirmNewPw) {
      setPwChangeError('New master passwords do not match.');
      return;
    }

    try {
      setIsChangingPw(true);
      await changeMasterPassword(currentPw, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmNewPw('');
    } catch (err) {
      setPwChangeError(err.message || 'Failed to change master password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportBackup();
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackupFileContent(event.target.result);
      setImportModalOpen(true);
      setImportError('');
      setBackupPassword('');
    };
    reader.onerror = () => {
      showToast('Failed to read file from disk.', 'error');
    };
    reader.readAsText(file);

    // Reset input value so user can reselect the same file if needed
    e.target.value = '';
  };

  const handleConfirmImport = async (e) => {
    e.preventDefault();
    setImportError('');

    if (!backupPassword) {
      setImportError('Please enter the password that was used to encrypt this backup.');
      return;
    }

    try {
      setIsImporting(true);
      await importBackup(backupFileContent, backupPassword);
      setImportModalOpen(false);
      setBackupFileContent('');
      setBackupPassword('');
    } catch (err) {
      setImportError(err.message || 'Import failed. Your existing vault was not changed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmReset = async () => {
    await resetVault();
    setResetModalOpen(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Settings & Security
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure auto-lock timers, export/import backups, and manage encryption keys.
        </p>
      </div>

      {/* Auto-Lock Settings Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={20} />
            <span>Inactivity Auto-Lock</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Automatically lock your vault and wipe decrypted credentials from memory when you leave your device idle.
        </p>

        <div className="form-group" style={{ maxWidth: '300px' }}>
          <label className="form-label" htmlFor="autolock-select">
            Auto-lock timeout:
          </label>
          <select
            id="autolock-select"
            value={autoLockMinutes}
            onChange={handleAutoLockChange}
            aria-label="Select auto-lock duration"
          >
            <option value={1}>1 Minute</option>
            <option value={5}>5 Minutes</option>
            <option value={15}>15 Minutes (Default)</option>
            <option value={30}>30 Minutes</option>
            <option value={60}>1 Hour</option>
            <option value={0}>Never (Not recommended)</option>
          </select>
        </div>
      </div>

      {/* Backup and Restore Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Download size={20} />
            <span>Encrypted Backup & Restore</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Export an encrypted copy of your vault to keep as a safe backup or transfer to another browser. Backups are
          protected by AES-GCM encryption with PBKDF2 key derivation.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleExport}>
            <Download size={18} />
            <span>Export Encrypted Backup (.json)</span>
          </button>

          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            <span>Restore from Backup (.json)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json,application/json"
            style={{ display: 'none' }}
            aria-label="Upload backup JSON file"
          />
        </div>
      </div>

      {/* Change Master Password Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <KeyRound size={20} />
            <span>Change Master Password</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Re-encrypts your entire credential collection with a new master password, generating a fresh PBKDF2 salt
          and fresh AES-GCM initialization vector.
        </p>

        {pwChangeError && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>{pwChangeError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="current-pw">
              Current Master Password
            </label>
            <input
              id="current-pw"
              type={showPwFields ? 'text' : 'password'}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current master password..."
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="new-pw">
                New Master Password
              </label>
              <input
                id="new-pw"
                type={showPwFields ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 8 characters..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-new-pw">
                Confirm New Password
              </label>
              <input
                id="confirm-new-pw"
                type={showPwFields ? 'text' : 'password'}
                value={confirmNewPw}
                onChange={(e) => setConfirmNewPw(e.target.value)}
                placeholder="Re-enter new password..."
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPwFields}
                onChange={(e) => setShowPwFields(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>Show passwords</span>
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={isChangingPw}
            >
              {isChangingPw ? 'Re-encrypting...' : 'Update Master Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Cryptographic Architecture Card */}
      <div className="card" style={{ backgroundColor: 'var(--bg-input)' }}>
        <div className="card-header">
          <div className="card-title" style={{ fontSize: '1rem' }}>
            <Shield size={18} />
            <span>Cryptographic Architecture & Privacy</span>
          </div>
        </div>

        <ul
          style={{
            listStyle: 'none',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            lineHeight: 1.5,
          }}
        >
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
            <span>
              <strong>Zero-Knowledge:</strong> Keys and credentials reside solely in active memory while unlocked and
              are cleared on lock or timeout.
            </span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
            <span>
              <strong>AES-GCM-256:</strong> Authenticated cipher protecting confidentiality and integrity against
              tampering.
            </span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
            <span>
              <strong>PBKDF2-HMAC-SHA-256:</strong> 250,000 iterations with a 128-bit cryptographically secure random
              salt.
            </span>
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>✓</span>
            <span>
              <strong>100% Local:</strong> All storage is in your browser's IndexedDB. No servers, trackers, or
              external APIs.
            </span>
          </li>
        </ul>
      </div>

      {/* Danger Zone */}
      <div
        className="card"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.03)',
        }}
      >
        <div className="card-header">
          <div className="card-title" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} />
            <span>Danger Zone</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Completely erase all encrypted credentials and settings from this browser's IndexedDB. This action cannot be
          undone unless you have an exported backup file.
        </p>

        <button className="btn-danger" onClick={() => setResetModalOpen(true)}>
          <Trash2 size={18} />
          <span>Reset & Wipe Entire Vault</span>
        </button>
      </div>

      {/* Import Backup Modal */}
      {importModalOpen && (
        <div className="modal-overlay" onClick={() => setImportModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
          >
            <div className="modal-header">
              <div className="card-title" id="import-modal-title">
                <Upload size={20} />
                <span>Restore Vault from Backup</span>
              </div>
            </div>

            <form onSubmit={handleConfirmImport}>
              <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  A backup file was selected. Enter the master password associated with this backup file to decrypt and
                  restore your credentials.
                </p>

                {importError && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-danger-bg)',
                      color: 'var(--color-danger)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>{importError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="backup-password">
                    Backup Master Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="backup-password"
                      type={showBackupPassword ? 'text' : 'password'}
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Password used to encrypt this backup..."
                      required
                      autoFocus
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setShowBackupPassword(!showBackupPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.4rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                      aria-label={showBackupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showBackupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Safeguard: If decryption or validation fails, your current vault will not be altered or overwritten.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setImportModalOpen(false)}
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isImporting}
                >
                  {isImporting ? 'Decrypting & Restoring...' : 'Restore Backup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Wipe Confirmation Modal */}
      {resetModalOpen && (
        <div className="modal-overlay" onClick={() => setResetModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="wipe-dialog-title"
          >
            <div className="modal-header">
              <div className="card-title" id="wipe-dialog-title" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={20} />
                <span>Confirm Database Wipe</span>
              </div>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Are you completely sure? This will delete all encrypted credentials and settings in this browser.
              </p>
              <p style={{ color: 'var(--color-danger)', fontSize: '0.825rem', marginTop: '0.5rem', fontWeight: 600 }}>
                This action is irreversible without a downloaded backup file!
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setResetModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmReset}
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
