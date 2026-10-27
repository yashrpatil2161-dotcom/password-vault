import React, { useState, useEffect, useCallback } from 'react';
import {
  Wand2,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  Shield,
  Sliders,
} from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '../../services/crypto';
import { useVault } from '../../context/VaultContext';

export default function PasswordGenerator({ onSaveToVault }) {
  const { showToast, settings } = useVault();

  const [length, setLength] = useState(settings?.defaultLength || 16);
  const [uppercase, setUppercase] = useState(settings?.includeUppercase ?? true);
  const [lowercase, setLowercase] = useState(settings?.includeLowercase ?? true);
  const [numbers, setNumbers] = useState(settings?.includeNumbers ?? true);
  const [symbols, setSymbols] = useState(settings?.includeSymbols ?? true);

  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    // If user has unchecked all, re-enable lowercase and uppercase
    let up = uppercase;
    let low = lowercase;
    let num = numbers;
    let sym = symbols;

    if (!up && !low && !num && !sym) {
      low = true;
      up = true;
      setLowercase(true);
      setUppercase(true);
    }

    const newPw = generatePassword({
      length,
      uppercase: up,
      lowercase: low,
      numbers: num,
      symbols: sym,
    });

    setPassword(newPw);
    setCopied(false);
  }, [length, uppercase, lowercase, numbers, symbols]);

  // Initial generation on load
  useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      showToast('Password copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      showToast('Could not copy to clipboard: ' + err.message, 'error');
    }
  };

  const strength = evaluatePasswordStrength(password);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          Password Generator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Generate cryptographically secure random passwords using the Web Crypto API.
        </p>
      </div>

      {/* Generated Display Card */}
      <div className="card" style={{ padding: '1.75rem', border: '1px solid var(--border-default)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
          }}
        >
          <div
            className="mono-text"
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              wordBreak: 'break-all',
              userSelect: 'all',
              letterSpacing: '0.08em',
            }}
          >
            {password}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={handleCopy}
              className={copied ? 'btn-secondary' : 'btn-primary'}
              style={{
                backgroundColor: copied ? 'var(--color-success)' : undefined,
                color: copied ? '#ffffff' : undefined,
                padding: '0.6rem 0.9rem',
              }}
              title="Copy password to clipboard"
              aria-label="Copy password"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleGenerate}
              className="btn-secondary"
              style={{ padding: '0.6rem 0.8rem' }}
              title="Generate new password"
              aria-label="Regenerate password"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Strength Meter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Security Rating:</span>
            <span style={{ color: strength.color, fontWeight: 600 }}>
              {strength.label} ({strength.entropy ? `${strength.entropy} bits` : ''})
            </span>
          </div>
          <div className="strength-meter">
            <div
              className="strength-bar"
              style={{
                width: `${strength.percent}%`,
                backgroundColor: strength.color,
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {strength.feedback}
          </div>
        </div>

        {/* Save to Vault Action */}
        {onSaveToVault && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => onSaveToVault(password)}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <PlusCircle size={18} />
              <span>Save this Password to Vault</span>
            </button>
          </div>
        )}
      </div>

      {/* Generator Controls Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={20} />
            <span>Customization Options</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Password Length */}
          <div className="form-group">
            <div className="form-label">
              <span>Password Length</span>
              <span className="mono-text" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '1rem' }}>
                {length}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                aria-label="Password length slider"
              />
              <input
                type="number"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(Math.max(8, Math.min(64, Number(e.target.value) || 8)))}
                style={{ width: '70px', textAlign: 'center' }}
                aria-label="Password length number input"
              />
            </div>
          </div>

          {/* Character Options Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Uppercase */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Uppercase Letters</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>A-Z</div>
              </div>
            </label>

            {/* Lowercase */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={lowercase}
                onChange={(e) => setLowercase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Lowercase Letters</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>a-z</div>
              </div>
            </label>

            {/* Numbers */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={numbers}
                onChange={(e) => setNumbers(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Numbers</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0-9</div>
              </div>
            </label>

            {/* Symbols */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={symbols}
                onChange={(e) => setSymbols(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Special Symbols</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>!@#$%^&*...</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
