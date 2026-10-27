import React from 'react';
import { Menu, ShieldCheck, Lock } from 'lucide-react';
import { useVault } from '../../context/VaultContext';

export default function Navbar({ onToggleSidebar, currentTabTitle }) {
  const { lockVault } = useVault();

  return (
    <header className="mobile-navbar">
      <button
        className="btn-icon"
        onClick={onToggleSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={22} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="brand-icon" style={{ width: 28, height: 28 }}>
          <ShieldCheck size={18} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{currentTabTitle || 'Password Vault'}</span>
      </div>

      <button
        onClick={lockVault}
        className="btn-icon"
        aria-label="Lock vault now"
        title="Lock Vault"
      >
        <Lock size={18} />
      </button>
    </header>
  );
}
