import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChallan, useConfirmChallan, useCancelChallan } from '../../hooks/useChallans';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, ErrorState } from '../../components/ui/States';
import { StampBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

function formatDate(s: string) {
  return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const PrintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
  </svg>
);

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: challan, isLoading, isError, refetch } = useChallan(id!);
  const confirm = useConfirmChallan(id!);
  const cancel = useCancelChallan(id!);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  const canConfirm = user?.role !== 'accounts' && challan?.status === 'draft';
  const canCancel  = (user?.role === 'admin' || user?.role === 'warehouse') && challan?.status !== 'confirmed';
  const canEdit    = user?.role !== 'accounts' && challan?.status === 'draft';
  const canExport  = challan?.status === 'confirmed';

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = async () => {
    setActionError('');
    try {
      await confirm.mutateAsync();
      setConfirmOpen(false);
      showToast({ type: 'success', title: 'Challan Confirmed', message: 'Stock has been deducted and dispatch confirmed.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setActionError(msg ?? 'Confirmation failed');
      showToast({ type: 'error', title: 'Confirmation Failed', message: msg ?? 'Stock check or confirmation failed' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      setCancelOpen(false);
      showToast({ type: 'info', title: 'Challan Cancelled', message: 'Challan status set to cancelled.' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      showToast({ type: 'error', title: 'Cancel Failed', message: msg ?? 'Failed to cancel challan' });
    }
  };

  if (isLoading) return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;
  if (isError || !challan) return <div className="main-content"><ErrorState onRetry={() => refetch()} /></div>;

  const total = challan.challan_items?.reduce((sum, i) => sum + Number(i.subtotal), 0) ?? 0;

  return (
    <>
      {/* ───────────────────────────────────────────────────────────────────────
          SCREEN VIEW
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="main-content screen-only-challan">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/challans')} aria-label="Back">
              <BackIcon />
            </button>
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
                Confirm &amp; Dispatch
              </button>
            )}
            {canExport && (
              <button
                id="export-pdf-btn"
                className="btn btn-secondary"
                onClick={handlePrint}
                title="Print challan"
              >
                <PrintIcon />
                Print Challan
              </button>
            )}
          </div>
        </div>

        {/* Customer card */}
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

        {/* Line items card */}
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--brick)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertIcon />
                          Only {item.product?.current_stock} in stock
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

      {/* ───────────────────────────────────────────────────────────────────────
          PRINT-ONLY DELIVERY CHALLAN DOCUMENT
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="print-invoice-document">
        {/* Document Header */}
        <div className="inv-header">
          <div className="inv-brand">
            <div className="inv-logo">FUNDSROOM</div>
            <div className="inv-sub">Operations Portal</div>
            <div className="inv-address">Generated delivery challan</div>
          </div>
          <div className="inv-meta-right">
            <div className="inv-title">DELIVERY CHALLAN</div>
            <div className="inv-number">{challan.challan_number}</div>
            <div className="inv-stamp-badge">{challan.status.toUpperCase()}</div>
          </div>
        </div>

        <div className="inv-divider" />

        {/* Address / Meta 2-column grid */}
        <div className="inv-grid">
          <div className="inv-box">
            <div className="inv-box-title">CONSIGNEE / BILLED TO</div>
            <div className="inv-customer-name">{challan.customer?.name}</div>
            {challan.customer?.business_name && (
              <div className="inv-text">{challan.customer.business_name}</div>
            )}
            <div className="inv-text">Address: {challan.customer?.address}</div>
            <div className="inv-text">Mobile: {challan.customer?.mobile}</div>
            {challan.customer?.gst_number && (
              <div className="inv-text">GSTIN: {challan.customer.gst_number}</div>
            )}
          </div>

          <div className="inv-box">
            <div className="inv-box-title">DISPATCH DETAILS</div>
            <div className="inv-row"><span>Challan Date:</span> <strong>{formatDateShort(challan.created_at)}</strong></div>
            <div className="inv-row"><span>Dispatched By:</span> <strong>{challan.creator?.name}</strong></div>
            <div className="inv-row"><span>Total Line Items:</span> <strong>{challan.challan_items?.length}</strong></div>
            <div className="inv-row"><span>Total Quantity:</span> <strong>{challan.total_quantity} units</strong></div>
          </div>
        </div>

        {/* Items Table */}
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Item Description</th>
              <th>SKU</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {challan.challan_items?.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td><strong>{item.product_name_snapshot}</strong></td>
                <td className="mono">{item.product_sku_snapshot}</td>
                <td style={{ textAlign: 'right' }} className="mono">
                  ₹{Number(item.unit_price_snapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ textAlign: 'center' }} className="mono">
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right' }} className="mono">
                  ₹{Number(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>GRAND TOTAL</td>
              <td style={{ textAlign: 'center', fontWeight: 700 }}>{challan.total_quantity}</td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '12pt' }} className="mono">
                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Terms & Signatures */}
        <div className="inv-footer">
          <div className="inv-terms">
            <div className="inv-box-title">TERMS &amp; CONDITIONS</div>
            <ol>
              <li>Goods should be verified by the recipient on delivery.</li>
              <li>This document records the stock dispatched under this challan.</li>
            </ol>
          </div>
          <div className="inv-signatory">
            <div className="inv-sign-title">For FUNDSROOM</div>
            <div className="inv-sign-space" />
            <div className="inv-sign-line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </>
  );
}
