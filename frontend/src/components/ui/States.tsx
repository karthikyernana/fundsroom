import React from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'default' }: { size?: 'default' | 'lg' | 'sm' }) {
  return (
    <div
      className={`spinner${size === 'lg' ? ' spinner-lg' : ''}`}
      style={size === 'sm' ? { width: 16, height: 16, borderWidth: 2 } : undefined}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📋', title, message, action }: EmptyStateProps) {
  return (
    <div className="state-container">
      <div className="state-icon">{icon}</div>
      <div className="state-title">{title}</div>
      {message && <div className="state-message">{message}</div>}
      {action}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <div className="state-container">
      <div className="state-icon">⚠️</div>
      <div className="state-title">Failed to load</div>
      <div className="state-message">{message}</div>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
