import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, AlertTriangle, HelpCircle, Upload, Trash2 } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export default function UnlockVault({ onOpenImportModal }) {
  const { unlockVault, resetVault } = useVault();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;

    setError('');
    setIsUnlocking(true);

    try {
      await unlockVault(password);
    } catch (err) {
      setError(err.message || 'Incorrect master password. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleConfirmReset = async () => {
    await resetVault();
    setShowResetConfirm(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            className="brand-icon"
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 1rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <Lock size={28} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Vault is Locked
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enter your master password to decrypt your credentials.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="unlock-password">
              Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="unlock-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                required
                autoFocus
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.4rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
                aria-label={showPassword ? 'Hide master password' : 'Show master password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isUnlocking}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isUnlocking ? (
              <span>Decrypting Vault...</span>
            ) : (
              <>
                <Unlock size={18} />
                <span>Unlock Vault</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowForgotHelp(!showForgotHelp)}
            style={{ fontSize: '0.85rem', padding: '0.2rem 0.4rem' }}
          >
            <HelpCircle size={15} />
            <span>Forgot Password?</span>
          </button>

          {onOpenImportModal && (
            <button
              type="button"
              className="btn-ghost"
              onClick={onOpenImportModal}
              style={{ fontSize: '0.85rem', padding: '0.2rem 0.4rem' }}
            >
              <Upload size={15} />
              <span>Restore Backup</span>
            </button>
          )}
        </div>

        {showForgotHelp && (
          <div
            style={{
              marginTop: '1rem',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Zero-Knowledge Recovery Information
            </div>
            <p style={{ marginBottom: '0.6rem' }}>
              Because your vault is encrypted with authenticated AES-GCM and zero-knowledge PBKDF2 key derivation,
              there is no master backdoor, reset email, or recovery key.
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              If you cannot remember the password, you can restore from a previously exported backup file or wipe the
              database to start fresh.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-danger"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setShowResetConfirm(true)}
              >
                <Trash2 size={13} />
                <span>Reset & Wipe Vault</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wipe Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ color: 'var(--color-danger)' }}>
                <AlertTriangle size={20} />
                <span>Reset Vault Data?</span>
              </div>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                This action will completely delete your local encrypted database. All credentials stored in this browser
                will be permanently destroyed unless you have a separate backup file.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmReset}
              >
                Yes, Wipe Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
