import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Globe,
  KeyRound,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import CredentialModal from './CredentialModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function VaultList() {
  const { credentials, deleteCredential, showToast } = useVault();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Set of credential IDs where password is currently revealed
  const [revealedIds, setRevealedIds] = useState(new Set());
  // Track recently copied password IDs for visual checkmark feedback
  const [copiedPwId, setCopiedPwId] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(null);

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyPassword = async (item) => {
    try {
      await navigator.clipboard.writeText(item.password);
      setCopiedPwId(item.id);
      showToast(`Password for "${item.name}" copied!`, 'success');
      setTimeout(() => setCopiedPwId(null), 2000);
    } catch (err) {
      showToast('Failed to copy password: ' + err.message, 'error');
    }
  };

  const handleCopyUsername = async (item) => {
    if (!item.username) return;
    try {
      await navigator.clipboard.writeText(item.username);
      setCopiedUserId(item.id);
      showToast(`Username for "${item.name}" copied!`, 'info');
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch (err) {
      showToast('Failed to copy username: ' + err.message, 'error');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteCredential(deletingItem.id);
      setDeletingItem(null);
    }
  };

  // Filter credentials based on search query (by name or username)
  const filteredCredentials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return credentials;
    return credentials.filter((item) => {
      const nameMatch = item.name && item.name.toLowerCase().includes(q);
      const userMatch = item.username && item.username.toLowerCase().includes(q);
      const urlMatch = item.url && item.url.toLowerCase().includes(q);
      return nameMatch || userMatch || urlMatch;
    });
  }, [credentials, searchQuery]);

  // Generate an avatar initial / background color for website icons
  const getAvatarLetter = (name) => {
    return name ? name.trim().charAt(0).toUpperCase() : '?';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
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
            My Password Vault
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {credentials.length} encrypted {credentials.length === 1 ? 'credential' : 'credentials'} stored locally.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add Password</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by website name, username, or URL..."
          style={{
            paddingLeft: '2.75rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            fontSize: '0.95rem',
          }}
          aria-label="Search vault credentials"
        />
      </div>

      {/* Credentials List / Cards */}
      {filteredCredentials.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            borderStyle: 'dashed',
          }}
        >
          <div
            className="brand-icon"
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 1.25rem',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
            }}
          >
            <KeyRound size={26} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            {credentials.length === 0 ? 'Your Vault is Empty' : 'No Matching Credentials Found'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            {credentials.length === 0
              ? 'Start saving your passwords securely in your browser. All entries are encrypted with AES-GCM-256 before saving.'
              : `We couldn't find any saved passwords matching "${searchQuery}". Check the spelling or clear the search.`}
          </p>

          {credentials.length === 0 ? (
            <button
              className="btn-primary"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
              style={{ margin: '0 auto' }}
            >
              <Plus size={18} />
              <span>Save Your First Password</span>
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => setSearchQuery('')}
              style={{ margin: '0 auto' }}
            >
              <span>Clear Search</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredCredentials.map((item) => {
            const isRevealed = revealedIds.has(item.id);
            const isCopied = copiedPwId === item.id;
            const isUserCopied = copiedUserId === item.id;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '1.15rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Header Row: Site Name, URL, Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                      }}
                    >
                      {getAvatarLetter(item.name)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.name}</h3>
                        {item.url && (
                          <a
                            href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                            title="Open website in new tab"
                            aria-label={`Open ${item.name} website`}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      {item.username && (
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <User size={13} style={{ color: 'var(--text-muted)' }} />
                          <span>{item.username}</span>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleCopyUsername(item)}
                            title="Copy username"
                            style={{ padding: '0.15rem 0.3rem', height: 'auto' }}
                            aria-label="Copy username"
                          >
                            {isUserCopied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(item)}
                      title="Edit Credential"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteClick(item)}
                      title="Delete Credential"
                      aria-label={`Delete ${item.name}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Password Display Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    backgroundColor: 'var(--bg-input)',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Password:
                    </span>
                    <span
                      className="mono-text"
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
                        letterSpacing: isRevealed ? '0.04em' : '0.25em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isRevealed ? item.password : '••••••••••••'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <button
                      className="btn-icon"
                      onClick={() => toggleReveal(item.id)}
                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                      aria-label={isRevealed ? 'Hide password' : 'Show password'}
                      style={{ padding: '0.35rem' }}
                    >
                      {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                    <button
                      className={isCopied ? 'btn-secondary' : 'btn-secondary'}
                      onClick={() => handleCopyPassword(item)}
                      title="Copy password"
                      aria-label="Copy password"
                      style={{
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.8rem',
                        backgroundColor: isCopied ? 'var(--color-success)' : undefined,
                        color: isCopied ? '#fff' : undefined,
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Notes (if present) */}
                {item.notes && (
                  <div
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <FileText size={14} style={{ marginTop: '0.2rem', color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <CredentialModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.name}
      />
    </div>
  );
}
