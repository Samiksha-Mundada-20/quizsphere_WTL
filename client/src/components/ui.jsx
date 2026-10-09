// ui.jsx - UI helpers used across multiple screens
import { useEffect, useRef } from 'react';

export function PageHead({ title, text, label }) {
  return (
    <div className="dash">
      <small>{label}</small>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

export function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

// Color-coded badge for statuses (e.g. Passed, Failed, Admin, Student)
export function Badge({ type = 'neutral', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

// Red error box; shows nothing when there is no message
export function Notice({ children }) {
  return children ? <div className="notice">{children}</div> : null;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false, busy = false }) {
  const cancelButton = useRef(null);

  useEffect(() => {
    cancelButton.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <p className="dialog-eyebrow">PLEASE CONFIRM</p>
        <h2 id="confirm-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button ref={cancelButton} type="button" className="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? 'dialog-confirm danger' : 'primary dialog-confirm'}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export const formatDate = (value) =>
  new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// 75 -> "75%", 66.67 -> "66.67%"
export const percent = (value) => Number(value) + '%';

export const categoryTags = (value) =>
  String(value || 'General').split(',').map((tag) => tag.trim()).filter(Boolean);
