import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct, useStockMovements, useAddStockMovement } from '../../hooks/useProducts';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';
import { Modal } from '../../components/ui/Modal';

function formatDateTime(s: string) {
  return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

import { useToast } from '../../components/ui/Toast';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const canWrite = user?.role === 'admin' || user?.role === 'warehouse';

  const { data: product, isLoading, isError, refetch } = useProduct(id!);
  const { data: movData, isLoading: movLoading } = useStockMovements(id!);
  const addMovement = useAddStockMovement(id!);

  const [modalOpen, setModalOpen] = useState(false);
  const [movType, setMovType] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [movError, setMovError] = useState('');

  const handleMovSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMovError('');
    const quantity = parseInt(qty);
    if (!quantity || quantity <= 0) { setMovError('Enter a positive integer quantity'); return; }
    if (product && movType === 'OUT' && quantity > product.current_stock) {
      setMovError(`Cannot deduct ${quantity} units: only ${product.current_stock} available in stock.`);
      return;
    }
    try {
      await addMovement.mutateAsync({ quantity_changed: quantity, movement_type: movType, reason });
      setModalOpen(false);
      setQty(''); setReason('');
      showToast({
        type: movType === 'IN' ? 'success' : 'warning',
        title: `Stock ${movType === 'IN' ? 'Added (+)' : 'Deducted (-)'}`,
        message: `Recorded ${movType} movement of ${quantity} units.`,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setMovError(msg ?? 'Stock movement failed');
      showToast({ type: 'error', title: 'Adjustment Failed', message: msg ?? 'Stock movement failed' });
    }
  };

  if (isLoading) return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;
  if (isError || !product) return <div className="main-content"><ErrorState message="Could not load product" onRetry={() => refetch()} /></div>;

  const isLow = product.current_stock <= product.min_stock_alert;

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}>←</button>
          <div>
            <h1 className="page-title">{product.name}</h1>
            <p className="page-subtitle mono">{product.sku}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp1)' }}>
          {canWrite && (
            <>
              <button id="adjust-stock-btn" className="btn btn-secondary" onClick={() => setModalOpen(true)}>
                Adjust Stock
              </button>
              <button className="btn btn-ghost" onClick={() => navigate(`/products/${id}/edit`)}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp3)', marginBottom: 'var(--sp3)' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Details</h3>
          </div>
          {[
            { label: 'SKU', value: product.sku, mono: true },
            { label: 'Category', value: product.category },
            { label: 'Unit Price', value: `₹${Number(product.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, mono: true },
            { label: 'Location', value: product.location || '—' },
            { label: 'Min Alert', value: String(product.min_stock_alert), mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} style={{ display: 'flex', gap: 'var(--sp2)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 100, flexShrink: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
              <span style={{ fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: '0.9375rem' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Stock card */}
        <div className="card" style={{ borderColor: isLow ? 'var(--brick)' : undefined }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Current Stock</h3>
            {isLow && <span className="badge badge-cancelled" style={{ background: 'var(--brick-light)', color: 'var(--brick)' }}>⚠ LOW</span>}
          </div>
          <div style={{ textAlign: 'center', padding: 'var(--sp4) 0' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '4rem', fontWeight: 700, color: isLow ? 'var(--brick)' : 'var(--ledger)', lineHeight: 1 }}>
              {product.current_stock}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 'var(--sp1)' }}>units available</div>
            {isLow && (
              <div style={{ marginTop: 'var(--sp2)', fontSize: '0.8125rem', color: 'var(--brick)' }}>
                Below minimum alert of {product.min_stock_alert} units
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Movement log */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Stock Movement Log</h3>
        </div>
        {movLoading ? (
          <div className="state-container"><Spinner /></div>
        ) : !movData?.movements.length ? (
          <EmptyState icon="📊" title="No movements recorded" message="Stock adjustments and challan dispatches will appear here." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {movData.movements.map((m) => (
                <tr key={m.id}>
                  <td className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{formatDateTime(m.created_at)}</td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 3, fontWeight: 600,
                      background: m.movement_type === 'IN' ? 'var(--olive-light)' : 'var(--brick-light)',
                      color: m.movement_type === 'IN' ? 'var(--olive)' : 'var(--brick)' }}>
                      {m.movement_type}
                    </span>
                  </td>
                  <td className="mono" style={{ fontWeight: 600, color: m.movement_type === 'IN' ? 'var(--olive)' : 'var(--brick)' }}>
                    {m.movement_type === 'IN' ? '+' : '−'}{m.quantity_changed}
                  </td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{m.reason || '—'}</td>
                  <td style={{ fontSize: '0.875rem' }}>{m.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust stock modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Adjust Stock"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button id="mov-submit" className="btn btn-primary" form="mov-form" type="submit" disabled={addMovement.isPending}>
              {addMovement.isPending ? <><Spinner size="sm" /> Saving…</> : 'Record Movement'}
            </button>
          </>
        }
      >
        <form id="mov-form" onSubmit={handleMovSubmit}>
          {movError && <div className="alert alert-error">{movError}</div>}
          <div className="form-group">
            <label className="form-label">Movement Type</label>
            <div style={{ display: 'flex', gap: 'var(--sp1)' }}>
              {(['IN', 'OUT'] as const).map((t) => (
                <button key={t} type="button"
                  className={`btn ${movType === t ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center',
                    background: movType === t ? (t === 'IN' ? 'var(--olive)' : 'var(--brick)') : undefined,
                    borderColor: movType === t ? (t === 'IN' ? 'var(--olive)' : 'var(--brick)') : undefined,
                  }}
                  onClick={() => setMovType(t)}>
                  {t === 'IN' ? '↑ IN' : '↓ OUT'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="mov-qty">Quantity *</label>
            <input id="mov-qty" type="number" min={1} className="form-input mono"
              value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="mov-reason">Reason</label>
            <input id="mov-reason" type="text" className="form-input"
              value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Received from supplier" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
