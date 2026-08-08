import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateChallan, useUpdateChallan, useChallan } from '../../hooks/useChallans';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';

interface LineItem {
  product_id: string;
  name: string;
  sku: string;
  unit_price: number;
  current_stock: number;
  quantity: number;
}

export default function ChallanForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading: existingLoading } = useChallan(id ?? '');
  const create = useCreateChallan();
  const update = useUpdateChallan(id ?? '');

  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');

  const { data: customersData } = useCustomers({ search: customerSearch || undefined, limit: 50 });
  const { data: productsData } = useProducts({ search: productSearch || undefined, limit: 50 });

  // Populate for edit
  React.useEffect(() => {
    if (isEdit && existing && !customerId) {
      setCustomerId(existing.customer_id);
      if (existing.challan_items) {
        setItems(existing.challan_items.map((ci) => ({
          product_id: ci.product_id,
          name: ci.product_name_snapshot,
          sku: ci.product_sku_snapshot,
          unit_price: Number(ci.unit_price_snapshot),
          current_stock: ci.product?.current_stock ?? 0,
          quantity: ci.quantity,
        })));
      }
    }
  }, [existing, isEdit, customerId]);

  const addProduct = (p: { id: string; name: string; sku: string; unit_price: number; current_stock: number }) => {
    const exists = items.find((i) => i.product_id === p.id);
    if (exists) {
      setItems((prev) => prev.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems((prev) => [...prev, { product_id: p.id, name: p.name, sku: p.sku, unit_price: p.unit_price, current_stock: p.current_stock, quantity: 1 }]);
    }
    setProductSearch('');
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } else {
      setItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = 'Select a customer';
    if (items.length === 0) errs.items = 'Add at least one product';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = { customer_id: customerId, items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })) };

    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        navigate(`/challans/${id}`);
      } else {
        const res = await create.mutateAsync(payload);
        navigate(`/challans/${(res.data as { data: { id: string } }).data.id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setSubmitError(msg ?? 'Failed to save challan');
    }
  };

  if (isEdit && existingLoading) return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const isPending = create.isPending || update.isPending;

  const selectedCustomer = customersData?.data.find((c) => c.id === customerId);

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(isEdit ? `/challans/${id}` : '/challans')}>←</button>
          <h1 className="page-title">{isEdit ? 'Edit Challan' : 'New Challan'}</h1>
        </div>
      </div>

      <form id="challan-form" onSubmit={handleSubmit}>
        {submitError && <div className="alert alert-error" style={{ marginBottom: 'var(--sp3)' }}>{submitError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp3)', marginBottom: 'var(--sp3)' }}>
          {/* Customer selector */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Customer *</h3>
              {selectedCustomer && <span style={{ fontSize: '0.875rem', color: 'var(--olive)', fontWeight: 500 }}>✓ Selected</span>}
            </div>
            {errors.customer && <div className="alert alert-error" style={{ marginBottom: 'var(--sp2)' }}>{errors.customer}</div>}
            {selectedCustomer ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--sp1) 0' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{selectedCustomer.name}</div>
                  {selectedCustomer.business_name && <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{selectedCustomer.business_name}</div>}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCustomerId('')}>Change</button>
              </div>
            ) : (
              <>
                <input className="form-input" placeholder="Search customer…"
                  value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  {customersData?.data.map((c) => (
                    <button key={c.id} type="button"
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      onClick={() => { setCustomerId(c.id); setCustomerSearch(''); }}>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      {c.business_name && <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{c.business_name}</div>}
                    </button>
                  ))}
                  {!customersData?.data.length && (
                    <div style={{ padding: 12, textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.875rem' }}>No customers found</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Summary</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 'var(--sp1) 0' }}>
              {[
                { label: 'Line Items', value: String(items.length) },
                { label: 'Total Units', value: String(totalQty) },
                { label: 'Total Value', value: `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{label}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product picker */}
        <div className="card" style={{ marginBottom: 'var(--sp3)' }}>
          <div className="card-header">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-muted)' }}>Add Products</h3>
          </div>
          {errors.items && <div className="alert alert-error" style={{ marginBottom: 'var(--sp2)' }}>{errors.items}</div>}
          <div className="search-input-wrapper" style={{ marginBottom: 'var(--sp2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="product-picker-search" className="search-input" placeholder="Search products to add…"
              value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          </div>
          {productSearch && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 'var(--sp2)' }}>
              {productsData?.data.map((p) => {
                const inList = items.find((i) => i.product_id === p.id);
                const isLow = p.current_stock <= p.min_stock_alert;
                return (
                  <button key={p.id} type="button"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 150ms', textAlign: 'left' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => addProduct({ id: p.id, name: p.name, sku: p.sku, unit_price: Number(p.unit_price), current_stock: p.current_stock })}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="mono" style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{p.sku}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontWeight: 600, color: 'var(--ledger)' }}>₹{Number(p.unit_price).toLocaleString('en-IN')}</div>
                      <div className="mono" style={{ fontSize: '0.75rem', color: isLow ? 'var(--brick)' : 'var(--ink-muted)', fontWeight: isLow ? 600 : 400 }}>
                        {p.current_stock} in stock{isLow ? ' ⚠' : ''}
                      </div>
                    </div>
                    <div style={{ marginLeft: 12 }}>
                      {inList ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--olive)', fontWeight: 600, background: 'var(--olive-light)', padding: '2px 8px', borderRadius: 999 }}>In list</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--ledger)', background: 'var(--ledger-dim)', padding: '2px 8px', borderRadius: 999 }}>+ Add</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Line items table */}
          {items.length === 0 ? (
            <EmptyState icon="🛒" title="No items added" message="Search for products above to add them to the challan." />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>In Stock</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const overstock = item.quantity > item.current_stock;
                  return (
                    <tr key={item.product_id} style={{ background: overstock ? 'var(--brick-light)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        {overstock && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--brick)' }}>⚠ Exceeds available stock</div>
                        )}
                      </td>
                      <td className="mono">{item.sku}</td>
                      <td className="mono" style={{ color: item.current_stock <= 0 ? 'var(--brick)' : 'var(--ink-muted)' }}>
                        {item.current_stock}
                      </td>
                      <td className="mono">₹{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <input
                          type="number" min={1} max={item.current_stock}
                          className="form-input mono"
                          style={{ width: 80, padding: '6px 8px' }}
                          value={item.quantity}
                          onChange={(e) => setQty(item.product_id, parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        ₹{(item.unit_price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--brick)' }}
                          onClick={() => setItems((prev) => prev.filter((i) => i.product_id !== item.product_id))}>
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp1)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(isEdit ? `/challans/${id}` : '/challans')}>Cancel</button>
          <button id="challan-submit" type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? <><Spinner size="sm" /> Saving…</> : isEdit ? 'Save Changes' : 'Save as Draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
