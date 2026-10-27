import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Wand2, Shield, Globe, User, Key, FileText } from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { generatePassword, evaluatePasswordStrength } from '../../services/crypto';

export default function CredentialModal({ isOpen, onClose, initialData = null }) {
  const { addCredential, updateCredential, showToast } = useVault();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditing = Boolean(initialData && initialData.id);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setUrl('');
      setUsername('');
      setPassword('');
      setNotes('');
    }
    setError('');
    setShowPassword(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const generated = generatePassword({ length: 16 });
    setPassword(generated);
    setShowPassword(true);
    showToast('Generated secure 16-character password.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a website or application name.');
      return;
    }

    if (!password) {
      setError('Please provide a password.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateCredential(initialData.id, {
          name,
          url,
          username,
          password,
          notes,
        });
      } else {
        await addCredential({
          name,
          url,
          username,
          password,
          notes,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save credential.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="card-title" id="modal-title">
            <Key size={20} />
            <span>{isEditing ? 'Edit Saved Password' : 'Save New Password'}</span>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                {error}
              </div>
            )}

            {/* Website or App Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="cred-name">
                <span>Application or Website Name *</span>
              </label>
              <input
                id="cred-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GitHub, Google, Slack"
                required
                autoFocus
              />
            </div>

            {/* URL */}
            <div className="form-group">
              <label className="form-label" htmlFor="cred-url">
                <span>Website URL</span>
              </label>
              <input
                id="cred-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Username / Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="cred-username">
                <span>Username or Email</span>
              </label>
              <input
                id="cred-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice@example.com or user123"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="cred-password">
                <span>Password *</span>
                {password && (
                  <span style={{ color: strength.color, fontWeight: 600, fontSize: '0.8rem' }}>
                    {strength.label}
                  </span>
                )}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    id="cred-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    required
                    className="mono-text"
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.35rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="btn-secondary"
                  title="Generate random password"
                  style={{ flexShrink: 0 }}
                >
                  <Wand2 size={16} />
                  <span>Generate</span>
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

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="cred-notes">
                <span>Optional Notes</span>
              </label>
              <textarea
                id="cred-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recovery codes, PIN, or security questions..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Encrypting & Saving...' : isEditing ? 'Save Changes' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
