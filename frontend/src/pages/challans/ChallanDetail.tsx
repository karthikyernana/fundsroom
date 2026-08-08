import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChallan, useConfirmChallan, useCancelChallan } from '../../hooks/useChallans';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, ErrorState } from '../../components/ui/States';
import { StampBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: challan, isLoading, isError, refetch } = useChallan(id!);
  const confirm = useConfirmChallan(id!);
  const cancel = useCancelChallan(id!);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const canConfirm = user?.role !== 'accounts' && challan?.status === 'draft';
  const canCancel = (user?.role === 'admin' || user?.role === 'warehouse') && challan?.status !== 'confirmed';
  const canEdit = user?.role !== 'accounts' && challan?.status === 'draft';

  const handleConfirm = async () => {
    setActionError('');
    try {
      await confirm.mutateAsync();
      setConfirmOpen(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setActionError(msg ?? 'Confirmation failed');
    }
  };

  const handleCancel = async () => {
    await cancel.mutateAsync();
    setCancelOpen(false);
  };

  if (isLoading) return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;
  if (isError || !challan) return <div className="main-content"><ErrorState onRetry={() => refetch()} /></div>;

  const total = challan.challan_items?.reduce((sum, i) => sum + Number(i.subtotal), 0) ?? 0;

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/challans')}>←</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
              <h1 className="page-title mono">{challan.challan_number}</h1>
              <StampBadge status={challan.status} />
            </div>
            <p className="page-subtitle">{formatDate(challan.created_at)} · by {challan.creator?.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp1)' }}>
          {canEdit && (
            <button className="btn btn-ghost" onClick={() => navigate(`/challans/${id}/edit`)}>Edit</button>
          )}
          {canCancel && challan.status === 'draft' && (
            <button id="cancel-challan-btn" className="btn btn-danger" onClick={() => setCancelOpen(true)}>Cancel</button>
          )}
          {canConfirm && (
            <button id="confirm-challan-btn" className="btn btn-primary" onClick={() => setConfirmOpen(true)}
              style={{ background: 'var(--olive)', borderColor: 'var(--olive)' }}>
              Confirm & Dispatch
            </button>
          )}
        </div>
      </div>

      {/* Customer */}
      <div className="card" style={{ marginBottom: 'var(--sp3)' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Customer</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)', padding: 'var(--sp1) 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--ledger-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--ledger)', fontSize: '1.1rem' }}>
            {challan.customer?.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{challan.customer?.name}</div>
            {challan.customer?.business_name && (
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{challan.customer.business_name}</div>
            )}
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>
            Line Items
          </h3>
          <span className="mono" style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            {challan.total_quantity} units total
          </span>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Unit Price</th>
              <th>Qty</th>
              <th style={{ textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {challan.challan_items?.map((item) => {
              const stockWarning = challan.status === 'draft' && item.product && item.product.current_stock < item.quantity;
              return (
                <tr key={item.id} style={{ background: stockWarning ? 'var(--brick-light)' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.product_name_snapshot}</div>
                    {stockWarning && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--brick)', marginTop: 2 }}>
                        ⚠ Only {item.product?.current_stock} in stock
                      </div>
                    )}
                  </td>
                  <td className="mono">{item.product_sku_snapshot}</td>
                  <td className="mono">₹{Number(item.unit_price_snapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{item.quantity}</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-muted)', padding: '12px 16px', borderTop: '2px solid var(--border)' }}>
                Total Value
              </td>
              <td className="mono" style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.125rem', padding: '12px 16px', borderTop: '2px solid var(--border)', color: 'var(--ledger)' }}>
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Confirm modal */}
      <Modal isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setActionError(''); }} title="Confirm Challan"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setConfirmOpen(false); setActionError(''); }}>Cancel</button>
            <button id="confirm-modal-btn" className="btn btn-primary"
              style={{ background: 'var(--olive)', borderColor: 'var(--olive)' }}
              onClick={handleConfirm} disabled={confirm.isPending}>
              {confirm.isPending ? <><Spinner size="sm" /> Confirming…</> : 'Yes, Confirm & Dispatch'}
            </button>
          </>
        }
      >
        {actionError && <div className="alert alert-error">{actionError}</div>}
        <p>Confirming challan <strong className="mono">{challan.challan_number}</strong> will:</p>
        <ul style={{ margin: 'var(--sp2) 0', paddingLeft: 'var(--sp3)', lineHeight: 2 }}>
          <li>Deduct stock for all {challan.challan_items?.length} line items</li>
          <li>Write an OUT movement to the stock log</li>
          <li>Mark this challan as confirmed — it cannot be edited after this</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
          If any product has insufficient stock, the entire operation will be rolled back.
        </p>
      </Modal>

      {/* Cancel modal */}
      <Modal isOpen={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Challan"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setCancelOpen(false)}>Keep Draft</button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancel.isPending}>
              {cancel.isPending ? <Spinner size="sm" /> : 'Yes, Cancel Challan'}
            </button>
          </>
        }
      >
        <p>Cancel challan <strong className="mono">{challan.challan_number}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
