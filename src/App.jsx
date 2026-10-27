import React, { useState } from 'react';
import { useVault } from './context/VaultContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Toast from './components/layout/Toast';
import SetupVault from './components/auth/SetupVault';
import UnlockVault from './components/auth/UnlockVault';
import Dashboard from './components/dashboard/Dashboard';
import VaultList from './components/vault/VaultList';
import PasswordGenerator from './components/generator/PasswordGenerator';
import Settings from './components/settings/Settings';
import CredentialModal from './components/vault/CredentialModal';
import { ShieldCheck, Upload, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const { loading, isInitialized, isLocked, importBackup } = useVault();

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal for saving password triggered from Generator page
  const [generatorSaveModalOpen, setGeneratorSaveModalOpen] = useState(false);
  const [presetPassword, setPresetPassword] = useState('');

  // Backup restore modal on locked screen
  const [lockedImportModalOpen, setLockedImportModalOpen] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupPassword, setShowBackupPassword] = useState(false);
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleSaveFromGenerator = (generatedPassword) => {
    setPresetPassword(generatedPassword);
    setGeneratorSaveModalOpen(true);
  };

  const handleLockedFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackupFileContent(event.target.result);
      setLockedImportModalOpen(true);
      setImportError('');
      setBackupPassword('');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmLockedImport = async (e) => {
    e.preventDefault();
    setImportError('');

    if (!backupPassword) {
      setImportError('Please enter the password that was used to encrypt this backup.');
      return;
    }

    try {
      setIsImporting(true);
      await importBackup(backupFileContent, backupPassword);
      setLockedImportModalOpen(false);
      setBackupFileContent('');
      setBackupPassword('');
    } catch (err) {
      setImportError(err.message || 'Import failed. Your vault was not changed.');
    } finally {
      setIsImporting(false);
    }
  };

  // 1. Initial storage loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          backgroundColor: 'var(--bg-app)',
        }}
      >
        <div
          className="brand-icon"
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}
        >
          <ShieldCheck size={32} />
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Opening encrypted local storage...
        </div>
      </div>
    );
  }

  // 2. First-time setup (no master password created yet)
  if (!isInitialized) {
    return (
      <>
        <SetupVault />
        <Toast />
      </>
    );
  }

  // 3. Locked state (requires master password to unlock)
  if (isLocked) {
    return (
      <>
        <UnlockVault onOpenImportModal={() => document.getElementById('locked-restore-input')?.click()} />
        <input
          id="locked-restore-input"
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleLockedFileSelected}
          aria-label="Restore backup while locked"
        />

        {/* Restore Backup Modal from Locked screen */}
        {lockedImportModalOpen && (
          <div className="modal-overlay" onClick={() => setLockedImportModalOpen(false)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="locked-import-title"
            >
              <div className="modal-header">
                <div className="card-title" id="locked-import-title">
                  <Upload size={20} />
                  <span>Restore Encrypted Backup</span>
                </div>
              </div>

              <form onSubmit={handleConfirmLockedImport}>
                <div className="modal-body">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Enter the master password for the backup file you selected. If verified, the backup will unlock and
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
                    <label className="form-label" htmlFor="locked-backup-password">
                      Backup Master Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="locked-backup-password"
                        type={showBackupPassword ? 'text' : 'password'}
                        value={backupPassword}
                        onChange={(e) => setBackupPassword(e.target.value)}
                        placeholder="Password for this backup..."
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
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setLockedImportModalOpen(false)}
                    disabled={isImporting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isImporting}
                  >
                    {isImporting ? 'Restoring...' : 'Restore & Unlock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Toast />
      </>
    );
  }

  // 4. Unlocked Main App Layout
  const tabTitles = {
    dashboard: 'Dashboard',
    vault: 'My Vault',
    generator: 'Password Generator',
    settings: 'Settings',
  };

  return (
    <div className="app-container">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="main-content">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentTabTitle={tabTitles[currentTab]}
        />

        <main className="content-body">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'vault' && <VaultList />}
          {currentTab === 'generator' && (
            <PasswordGenerator onSaveToVault={handleSaveFromGenerator} />
          )}
          {currentTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Save Modal from Generator */}
      <CredentialModal
        isOpen={generatorSaveModalOpen}
        onClose={() => setGeneratorSaveModalOpen(false)}
        initialData={presetPassword ? { password: presetPassword } : null}
      />

      <Toast />
    </div>
  );
}
