import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  KeyRound,
  Wand2,
  Settings as SettingsIcon,
  Lock,
  X,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export default function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen }) {
  const { lockVault, credentials } = useVault();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'My Vault', icon: KeyRound, count: credentials.length },
    { id: 'generator', label: 'Generator', icon: Wand2 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="brand-name">Password Vault</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zero-Knowledge AES-GCM
            </div>
          </div>
          {isOpen && (
            <button
              className="btn-icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                aria-label={`Navigate to ${item.label}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={19} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="badge badge-info" style={{ padding: '0.1rem 0.45rem', fontSize: '0.7rem' }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              padding: '0.6rem 0.75rem',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                display: 'inline-block',
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Vault Decrypted (RAM)</span>
          </div>

          <button
            data-testid="sidebar-lock-btn"
            onClick={lockVault}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            title="Wipes decrypted keys from memory immediately"
          >
            <Lock size={16} />
            <span>Lock Vault</span>
          </button>
        </div>
      </aside>
    </>
  );
}
