import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px' }}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="modal-header">
          <div className="card-title" id="delete-dialog-title" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} />
            <span>Confirm Deletion</span>
          </div>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Are you sure you want to delete the saved credentials for{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{itemName || 'this item'}</strong>?
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.5rem' }}>
            This action will remove the record from your encrypted vault and cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            <span>Delete Credential</span>
          </button>
        </div>
      </div>
    </div>
  );
}
