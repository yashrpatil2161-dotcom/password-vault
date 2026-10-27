import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, AlertTriangle, KeyRound, Lock } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { evaluatePasswordStrength } from '../../services/crypto';

export default function SetupVault() {
  const { setupVault } = useVault();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Master password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      await setupVault(password);
    } catch (err) {
      setError(err.message || 'Failed to initialize vault.');
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            className="brand-icon"
            style={{
              width: 54,
              height: 54,
              margin: '0 auto 1rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Set Up Your Password Vault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose a strong master password to encrypt your personal credentials locally.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="setup-password">
              <span>Master Password</span>
              {password && (
                <span style={{ color: strength.color, fontWeight: 600, fontSize: '0.8rem' }}>
                  {strength.label}
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="setup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter at least 8 characters..."
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <div className="strength-meter">
                <div
                  className="strength-bar"
                  style={{
                    width: `${strength.percent}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="setup-confirm">
              Confirm Master Password
            </label>
            <input
              id="setup-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your master password..."
              required
            />
          </div>

          {/* Zero-Knowledge Security Notice */}
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--color-warning)',
                fontWeight: 600,
                marginBottom: '0.35rem',
              }}
            >
              <AlertTriangle size={16} />
              <span>Important Security Notice</span>
            </div>
            Your master password is never stored or transmitted anywhere. All data is encrypted locally using
            authenticated <strong>AES-GCM-256</strong>. If you forget your master password, your vault{' '}
            <strong>cannot be recovered</strong> without an existing backup file.
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {isSubmitting ? (
              <span>Deriving Key & Encrypting...</span>
            ) : (
              <>
                <Lock size={18} />
                <span>Create & Encrypt Vault</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
