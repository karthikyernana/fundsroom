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

// ─── SVG Icons for states ──────────────────────────────────────────────────────
const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="8" y1="12" x2="16" y2="12" opacity="0.5"/>
  </svg>
);

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
  </svg>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string | React.ReactNode;  // kept for backward compat (emoji or ReactNode)
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="state-container">
      <div className="state-icon">
        {icon && typeof icon === 'string' && icon !== ''
          ? <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          : icon && typeof icon !== 'string'
          ? icon
          : <EmptyIcon />}
      </div>
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
      <div className="state-icon" style={{ background: 'var(--brick-light)', color: 'var(--brick)' }}>
        <ErrorIcon />
      </div>
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
