import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer, useAddCustomerNote } from '../../hooks/useCustomers';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'sales';

  const { data: customer, isLoading, isError, refetch } = useCustomer(id!);
  const addNote = useAddCustomerNote(id!);

  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');

  const { showToast } = useToast();

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) { setNoteError('Note cannot be empty'); return; }
    setNoteError('');
    try {
      await addNote.mutateAsync(noteText.trim());
      setNoteText('');
      showToast({ type: 'success', title: 'Note Added', message: 'Follow-up note appended to customer timeline.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setNoteError(msg ?? 'Failed to add note');
      showToast({ type: 'error', title: 'Failed', message: msg ?? 'Failed to add note' });
    }
  };

  if (isLoading) {
    return (
      <div className="main-content">
        <div className="state-container" style={{ marginTop: 80 }}><Spinner size="lg" /></div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="main-content">
        <ErrorState message="Could not load customer" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/customers')} aria-label="Back">
            ←
          </button>
          <div>
            <h1 className="page-title">{customer.name}</h1>
            {customer.business_name && (
              <p className="page-subtitle">{customer.business_name}</p>
            )}
          </div>
        </div>
        {canWrite && (
          <button
            id="edit-customer-btn"
            className="btn btn-secondary"
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            Edit
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp3)', marginBottom: 'var(--sp3)' }}>
        {/* ── Details card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
              Details
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <Badge variant={customer.status}>{customer.status}</Badge>
              <Badge variant={customer.customer_type}>{customer.customer_type}</Badge>
            </div>
          </div>

          {[
            { label: 'Mobile', value: customer.mobile, mono: true },
            { label: 'Email', value: customer.email || '—' },
            { label: 'GST Number', value: customer.gst_number || '—', mono: true },
            { label: 'Address', value: customer.address },
            {
              label: 'Follow-up',
              value: customer.follow_up_date ? formatDate(customer.follow_up_date) : '—',
              mono: true,
            },
            { label: 'Customer since', value: formatDate(customer.created_at), mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ display: 'flex', gap: 'var(--sp2)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 120, flexShrink: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </span>
              <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: mono ? '0.875rem' : '0.9375rem', color: 'var(--ink)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Stats card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
              Activity
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 'var(--sp3)', padding: 'var(--sp2) 0' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--ledger)' }}>
                {customer._count?.challans ?? 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Challans</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 600, color: 'var(--stamp)' }}>
                {customer.customer_notes?.length ?? 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>Notes</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes timeline */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
            Follow-up Notes
          </h3>
        </div>

        {canWrite && (
          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 'var(--sp1)', marginBottom: 'var(--sp3)', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <textarea
                id="note-input"
                className={`form-textarea${noteError ? ' error' : ''}`}
                placeholder="Add a follow-up note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ minHeight: 72, resize: 'vertical' }}
              />
              {noteError && <div className="form-error">{noteError}</div>}
            </div>
            <button
              id="add-note-btn"
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={addNote.isPending}
              style={{ marginTop: 2 }}
            >
              {addNote.isPending ? <Spinner size="sm" /> : 'Add'}
            </button>
          </form>
        )}

        {!customer.customer_notes?.length ? (
          <EmptyState icon="📝" title="No notes yet" message="Add a follow-up note above to start the timeline." />
        ) : (
          <div className="notes-timeline">
            {customer.customer_notes.map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-meta">
                  {note.user.name} · {formatDateTime(note.created_at)}
                </div>
                <div className="note-text">{note.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
