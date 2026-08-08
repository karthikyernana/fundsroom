import React from 'react';

// ─── Badge ────────────────────────────────────────────────────────────────────
// For customer status, customer type, role labels
interface BadgeProps {
  variant: string; // maps to CSS class: badge-{variant}
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ─── StampBadge ───────────────────────────────────────────────────────────────
// §2 signature element — challan status only
// Slightly rotated, monospace, bordered — like an ink stamp on dispatch paperwork
type ChallanStatus = 'draft' | 'confirmed' | 'cancelled';

interface StampBadgeProps {
  status: ChallanStatus;
}

const STAMP_LABELS: Record<ChallanStatus, string> = {
  draft: 'DRAFT',
  confirmed: 'CONFIRMED',
  cancelled: 'CANCELLED',
};

export function StampBadge({ status }: StampBadgeProps) {
  return (
    <span className={`stamp-badge stamp-${status}`} aria-label={`Status: ${status}`}>
      {STAMP_LABELS[status]}
    </span>
  );
}
