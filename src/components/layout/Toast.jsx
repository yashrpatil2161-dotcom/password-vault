import React from 'react';
import { useVault } from '../../context/VaultContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useVault();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let className = 'toast toast-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          className = 'toast toast-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          className = 'toast toast-error';
        }

        return (
          <div key={toast.id} className={className}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn-icon"
              aria-label="Dismiss notification"
              style={{ padding: '0.2rem' }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
