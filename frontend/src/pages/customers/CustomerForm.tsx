import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { Spinner, ErrorState } from '../../components/ui/States';

// Minimal local form hook — avoids a library dep
function useFormState<T extends Record<string, unknown>>(initial: T) {
  const [values, setValues] = React.useState(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const set = (field: keyof T, value: unknown) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  return { values, errors, set, setErrors };
}

const EMPTY: Record<string, string> = {
  name: '', mobile: '', email: '', business_name: '',
  gst_number: '', customer_type: 'wholesale', address: '',
  status: 'lead', follow_up_date: '', notes: '',
};

export default function CustomerForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading, isError } = useCustomer(id ?? '');
  const create = useCreateCustomer();
  const update = useUpdateCustomer(id ?? '');

  const { values, errors, set, setErrors } = useFormState<Record<string, string>>(EMPTY);
  const [submitError, setSubmitError] = React.useState('');

  // Populate form when editing
  useEffect(() => {
    if (isEdit && existing) {
      Object.entries(EMPTY).forEach(([key]) => {
        const val = (existing as Record<string, unknown>)[key];
        if (val !== undefined && val !== null) {
          let strVal = String(val);
          if (key === 'follow_up_date' && strVal) {
            strVal = strVal.split('T')[0]; // date input needs YYYY-MM-DD
          }
          set(key, strVal);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, isEdit]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    if (!values.mobile.trim() || values.mobile.length < 10) errs.mobile = 'Valid mobile required';
    if (!values.address.trim()) errs.address = 'Address is required';
    if (!values.customer_type) errs.customer_type = 'Customer type is required';
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errs.email = 'Invalid email format';
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
      mobile: values.mobile,
      email: values.email || undefined,
      business_name: values.business_name || undefined,
      gst_number: values.gst_number || undefined,
      customer_type: values.customer_type as 'retail' | 'wholesale' | 'distributor',
      address: values.address,
      status: values.status as 'lead' | 'active' | 'inactive',
      follow_up_date: values.follow_up_date ? new Date(values.follow_up_date).toISOString() : undefined,
      notes: values.notes || undefined,
    };

    try {
      if (isEdit) {
        await update.mutateAsync(payload);
        navigate(`/customers/${id}`);
      } else {
        const res = await create.mutateAsync(payload);
        navigate(`/customers/${(res.data as { data: { id: string } }).data.id}`);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: { message?: string; details?: { field: string; message: string }[] } } } };
      const details = apiErr?.response?.data?.error?.details;
      if (details) {
        const fieldErrs: Record<string, string> = {};
        details.forEach((d) => { fieldErrs[d.field] = d.message; });
        setErrors(fieldErrs);
      } else {
        setSubmitError(apiErr?.response?.data?.error?.message ?? 'Save failed. Please try again.');
      }
    }
  };

  if (isEdit && isLoading) {
    return <div className="main-content"><div className="state-container"><Spinner size="lg" /></div></div>;
  }
  if (isEdit && isError) {
    return <div className="main-content"><ErrorState message="Could not load customer" /></div>;
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="main-content">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}>
            ←
          </button>
          <h1 className="page-title">{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        {submitError && <div className="alert alert-error" style={{ marginBottom: 'var(--sp2)' }}>{submitError}</div>}

        <form id="customer-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="c-name">Full Name *</label>
              <input id="c-name" type="text" className={`form-input${errors.name ? ' error' : ''}`}
                value={values.name} onChange={(e) => set('name', e.target.value)} />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-mobile">Mobile *</label>
              <input id="c-mobile" type="tel" className={`form-input${errors.mobile ? ' error' : ''}`}
                value={values.mobile} onChange={(e) => set('mobile', e.target.value)} />
              {errors.mobile && <div className="form-error">{errors.mobile}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
                value={values.email} onChange={(e) => set('email', e.target.value)} />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-business">Business Name</label>
              <input id="c-business" type="text" className="form-input"
                value={values.business_name} onChange={(e) => set('business_name', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-gst">GST Number</label>
              <input id="c-gst" type="text" className={`form-input mono${errors.gst_number ? ' error' : ''}`}
                value={values.gst_number} onChange={(e) => set('gst_number', e.target.value.toUpperCase())}
                placeholder="27AABCP1234A1Z5" />
              {errors.gst_number && <div className="form-error">{errors.gst_number}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-type">Customer Type *</label>
              <select id="c-type" className={`form-select${errors.customer_type ? ' error' : ''}`}
                value={values.customer_type} onChange={(e) => set('customer_type', e.target.value)}>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="distributor">Distributor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-status">Status</label>
              <select id="c-status" className="form-select"
                value={values.status} onChange={(e) => set('status', e.target.value)}>
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="c-followup">Follow-up Date</label>
              <input id="c-followup" type="date" className="form-input mono"
                value={values.follow_up_date} onChange={(e) => set('follow_up_date', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="c-address">Address *</label>
            <textarea id="c-address" className={`form-textarea${errors.address ? ' error' : ''}`}
              value={values.address} onChange={(e) => set('address', e.target.value)}
              style={{ minHeight: 80 }} />
            {errors.address && <div className="form-error">{errors.address}</div>}
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp1)', justifyContent: 'flex-end', paddingTop: 'var(--sp2)', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(isEdit ? `/customers/${id}` : '/customers')}>
              Cancel
            </button>
            <button id="customer-submit" type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? <><Spinner size="sm" /> Saving…</> : isEdit ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
