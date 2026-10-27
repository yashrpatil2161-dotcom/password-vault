import React, { useState } from 'react';
import {
  KeyRound,
  Wand2,
  ShieldCheck,
  ArrowRight,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Clock,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { generatePassword, evaluatePasswordStrength } from '../../services/crypto';
import CredentialModal from '../vault/CredentialModal';

export default function Dashboard({ onNavigate }) {
  const { credentials, showToast, lockVault } = useVault();

  // Quick generator in dashboard
  const [quickPassword, setQuickPassword] = useState(() => generatePassword({ length: 16 }));
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [presetPassword, setPresetPassword] = useState('');

  const handleRegenerateQuick = () => {
    setQuickPassword(generatePassword({ length: 16 }));
    setCopiedQuick(false);
  };

  const handleCopyQuick = async () => {
    try {
      await navigator.clipboard.writeText(quickPassword);
      setCopiedQuick(true);
      showToast('Quick password copied to clipboard!', 'success');
      setTimeout(() => setCopiedQuick(false), 2000);
    } catch (err) {
      showToast('Failed to copy: ' + err.message, 'error');
    }
  };

  const handleSaveQuickPassword = () => {
    setPresetPassword(quickPassword);
    setModalOpen(true);
  };

  // Recent credentials (sorted by createdAt or updatedAt desc, max 5)
  // IMPORTANT: Prompt specifically states: "Do not display actual passwords on the dashboard."
  const recentCredentials = [...credentials]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

  const quickStrength = evaluatePasswordStrength(quickPassword);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner / Welcome */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Vault Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Personal zero-knowledge password generator and local encrypted vault.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            onClick={() => {
              setPresetPassword('');
              setModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Password</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Credentials Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            className="brand-icon"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-dark)',
              color: '#ffffff',
            }}
          >
            <KeyRound size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Saved Credentials</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {credentials.length}
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => onNavigate('vault')}
            title="Open Vault"
            aria-label="Open Vault shortcut"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Security Status Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            className="brand-icon"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--color-success)',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Encryption Status</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-success)' }}>
              AES-GCM-256 Active
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>250,000 PBKDF2 iterations</div>
          </div>
        </div>

        {/* Quick Lock Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            className="brand-icon"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--color-primary)',
            }}
          >
            <Lock size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Session Security</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Auto-Lock Protected
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zero-knowledge in-RAM only</div>
          </div>
          <button
            className="btn-secondary"
            onClick={lockVault}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            Lock Now
          </button>
        </div>
      </div>

      {/* Main Content Grid: Quick Generator & Recent Credentials */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Quick Password Generator Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div className="card-title">
              <Wand2 size={20} />
              <span>Quick Password Generator</span>
            </div>
            <button
              className="btn-ghost"
              onClick={() => onNavigate('generator')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
            >
              <span>Advanced Options</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Instant 16-character secure random password with mixed cases, numbers, and symbols:
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              gap: '0.75rem',
            }}
          >
            <div
              className="mono-text"
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.05em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {quickPassword}
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
              <button
                className="btn-icon"
                onClick={handleRegenerateQuick}
                title="Generate another"
                aria-label="Generate another password"
              >
                <RefreshCw size={16} />
              </button>

              <button
                className={copiedQuick ? 'btn-secondary' : 'btn-primary'}
                onClick={handleCopyQuick}
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.825rem',
                  backgroundColor: copiedQuick ? 'var(--color-success)' : undefined,
                  color: copiedQuick ? '#fff' : undefined,
                }}
                title="Copy to clipboard"
                aria-label="Copy quick password"
              >
                {copiedQuick ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedQuick ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Strength:</span>
            <span style={{ color: quickStrength.color, fontWeight: 600 }}>{quickStrength.label}</span>
          </div>

          <button
            className="btn-secondary"
            onClick={handleSaveQuickPassword}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Save this to My Vault</span>
          </button>
        </div>

        {/* Recently Added Credentials Card (NO PASSWORDS DISPLAYED) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card-header" style={{ marginBottom: '0.5rem' }}>
            <div className="card-title">
              <Clock size={20} />
              <span>Recently Saved Entries</span>
            </div>
            <button
              className="btn-ghost"
              onClick={() => onNavigate('vault')}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {recentCredentials.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}
            >
              No credentials saved yet. Use the button above to add your first password!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentCredentials.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.9rem',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.775rem',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.username || (item.url ? item.url : 'No username')}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() => onNavigate('vault')}
                    title="View in Vault"
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.775rem' }}
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
            <button
              className="btn-primary"
              onClick={() => onNavigate('vault')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <KeyRound size={16} />
              <span>Open My Password Vault</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credential Modal for Quick Save */}
      <CredentialModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={presetPassword ? { password: presetPassword } : null}
      />
    </div>
  );
}
