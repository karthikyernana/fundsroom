import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { Spinner, ErrorState } from '../../components/ui/States';
import { useToast } from '../../components/ui/Toast';

const EMPTY = { name: '', sku: '', category: '', unit_price: '', current_stock: '0', min_stock_alert: '10', location: '' };

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: existing, isLoading, isError } = useProduct(id ?? '');
  const create = useCreateProduct();
  const update = useUpdateProduct(id ?? '');

  const [values, setValues] = React.useState(EMPTY);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitError, setSubmitError] = React.useState('');

  const set = (k: string, v: string) => {
    setValues((prev) => ({ ...prev, [k]: k === 'sku' ? v.toUpperCase() : v }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  useEffect(() => {
    if (isEdit && existing) {
      setValues({
        name: existing.name,
        sku: existing.sku,
        category: existing.category,
        unit_price: String(existing.unit_price),
        current_stock: String(existing.current_stock),
        min_stock_alert: String(existing.min_stock_alert),
        location: existing.location ?? '',
      });
    }
  }, [existing, isEdit]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    if (!values.sku.trim()) errs.sku = 'SKU is required';
    if (!values.category.trim()) errs.category = 'Category is required';
    if (!values.unit_price || Number(values.unit_price) <= 0) errs.unit_price = 'Enter a positive price';
    if (isEdit && values.current_stock !== '') {
      // In edit mode, current_stock field is hidden (only via stock movements)
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    const payload = {
      name: values.name,
      sku: values.sku,
      category: values.category,
      unit_price: Number(values.unit_price),
      current_stock: isEdit ? undefined : Number(values.current_stock),
      min_stock_alert: Number(values.min_stock_alert),
      location: values.location || undefined,
    };

    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        showToast({ type: 'success', title: 'Product Updated', message: 'Product details saved successfully.' });
        navigate(`/products/${id}`);
      } else {
        const res = await create.mutateAsync(payload);
        showToast({ type: 'success', title: 'Product Created', message: 'New product added to inventory.' });
        navigate(`/products/${(res.data as { data: { id: string } }).data.id}`);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; details?: { field: string; message: string }[] } } } };
      const details = apiErr?.response?.data?.error?.details;
      if (details) {
        const fieldErrs: Record<string, string> = {};
        details.forEach((d) => { fieldErrs[d.field] = d.message; });
        setErrors(fieldErrs);
        showToast({ type: 'error', title: 'Validation Failed', message: 'Please fix highlighted errors.' });
      } else {
        const msg = apiErr?.response?.data?.error?.message ?? 'Save failed';
        setSubmitError(msg);
        showToast({ type: 'error', title: 'Save Failed', message: msg });
      }
    }
  };

  if (isEdit && isLoading) return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;
  if (isEdit && isError) return <div className="main-content"><ErrorState /></div>;

  const isPending = create.isPending || update.isPending;

  const Field = ({ id: fid, label, type = 'text', required = false, mono = false, placeholder = '' }: { id: string; label: string; type?: string; required?: boolean; mono?: boolean; placeholder?: string }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={fid}>{label}{required && ' *'}</label>
      <input id={fid} type={type} className={`form-input${mono ? ' mono' : ''}${errors[fid] ? ' error' : ''}`}
        value={values[fid as keyof typeof values]} onChange={(e) => set(fid, e.target.value)} placeholder={placeholder} />
      {errors[fid] && <div className="form-error">{errors[fid]}</div>}
    </div>
  );

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>←</button>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {submitError && <div className="alert alert-error">{submitError}</div>}
        <form id="product-form" onSubmit={handleSubmit}>
          <Field id="name" label="Product Name" required />
          <div className="form-grid">
            <Field id="sku" label="SKU" required mono placeholder="BRG-6205-STD" />
            <Field id="category" label="Category" required placeholder="Bearings" />
            <Field id="unit_price" label="Unit Price (₹)" type="number" required mono />
            <Field id="min_stock_alert" label="Min Stock Alert" type="number" mono />
            {!isEdit && <Field id="current_stock" label="Opening Stock" type="number" mono />}
            <Field id="location" label="Warehouse Location" placeholder="Rack A-12" />
          </div>

          {isEdit && (
            <div className="alert alert-warning" style={{ marginTop: 'var(--sp1)' }}>
              To adjust stock levels, use the <strong>Adjust Stock</strong> button on the product page — this maintains the audit trail.
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--sp1)', justifyContent: 'flex-end', paddingTop: 'var(--sp2)', borderTop: '1px solid var(--border)', marginTop: 'var(--sp2)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(isEdit ? `/products/${id}` : '/products')}>Cancel</button>
            <button id="product-submit" type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? <><Spinner size="sm" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
