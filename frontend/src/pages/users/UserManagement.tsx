import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Spinner, ErrorState } from '../../components/ui/States';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
  created_at: string;
}

const ROLES: Array<{ value: User['role']; label: string }> = [
  { value: 'admin',     label: 'Admin'     },
  { value: 'sales',     label: 'Sales'     },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'accounts',  label: 'Accounts'  },
];

const ROLE_DESCRIPTIONS: Record<User['role'], string> = {
  admin:     'Full access across all modules. Can create and manage users.',
  sales:     'Full CRM access. Read-only products. Create & confirm challans.',
  warehouse: 'Full product & stock access. Read-only customers. Manage challans.',
  accounts:  'Read-only access across all modules for financial oversight.',
};

const ROLE_COLORS: Record<User['role'], { bg: string; color: string }> = {
  admin:     { bg: 'rgba(31,77,61,0.10)',   color: 'var(--ledger)' },
  sales:     { bg: 'rgba(201,138,44,0.10)', color: 'var(--stamp)'  },
  warehouse: { bg: 'rgba(76,107,63,0.12)',  color: 'var(--olive)'  },
  accounts:  { bg: 'rgba(166,52,26,0.08)',  color: 'var(--brick)'  },
};

function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data.data as User[];
    },
  });
}

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: users = [], isLoading, isError, refetch } = useUsers();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales' as User['role'] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const res = await api.post('/auth/register', body);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast({ type: 'success', title: 'User created', message: `${vars.name} can now sign in with the provided credentials.` });
      setForm({ name: '', email: '', password: '', role: 'sales' });
      setErrors({});
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: { message?: string; details?: Record<string, string[]> } } } };
      const details = axErr?.response?.data?.error?.details;
      if (details) {
        const mapped: Record<string, string> = {};
        Object.entries(details).forEach(([k, msgs]) => { mapped[k] = msgs[0]; });
        setErrors(mapped);
      } else {
        const msg = axErr?.response?.data?.error?.message ?? 'Could not create user.';
        showToast({ type: 'error', title: 'Error', message: msg });
      }
    },
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) createMutation.mutate(form);
  };

  return (
    <div className="main-content">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {users.length} system {users.length === 1 ? 'user' : 'users'} · Admin access only
          </p>
        </div>
        <button
          id="new-user-btn"
          className="btn btn-primary"
          onClick={() => setShowForm(v => !v)}
        >
          <PlusIcon />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* ── Create User Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 'var(--sp4)', maxWidth: 600 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldIcon />
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Create New User</h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate style={{ padding: '4px 0' }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="u-name">Full Name</label>
                <input
                  id="u-name"
                  type="text"
                  className={`form-input${errors.name ? ' error' : ''}`}
                  placeholder="e.g. Priya Sharma"
                  maxLength={100}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="u-email">Email Address</label>
                <input
                  id="u-email"
                  type="email"
                  className={`form-input${errors.email ? ' error' : ''}`}
                  placeholder="user@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="u-password">Temporary Password</label>
                <input
                  id="u-password"
                  type="password"
                  className={`form-input${errors.password ? ' error' : ''}`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="u-role">Role</label>
                <select
                  id="u-role"
                  className="form-select"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role description */}
            <div style={{
              padding: 'var(--sp2)',
              background: ROLE_COLORS[form.role].bg,
              border: `1px solid ${ROLE_COLORS[form.role].color}22`,
              borderRadius: 'var(--radius)',
              marginTop: 4,
              marginBottom: 'var(--sp2)',
              fontSize: '0.875rem',
              color: ROLE_COLORS[form.role].color,
              lineHeight: 1.5,
            }}>
              <strong>{ROLES.find(r => r.value === form.role)?.label}</strong> — {ROLE_DESCRIPTIONS[form.role]}
            </div>

            <div style={{ display: 'flex', gap: 'var(--sp1)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setErrors({}); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="table-container">
        {isLoading ? (
          <div className="state-container"><Spinner size="lg" /></div>
        ) : isError ? (
          <ErrorState message="Could not load users." onRetry={() => refetch()} />
        ) : users.length === 0 ? (
          <div className="state-container">
            <div style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)' }}>No users found.</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="user-avatar-cell">
                      <div className="user-avatar-sm" style={{ background: ROLE_COLORS[u.role].bg, color: ROLE_COLORS[u.role].color }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{u.email}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background: ROLE_COLORS[u.role].bg,
                      color: ROLE_COLORS[u.role].color,
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--ink-faint)', maxWidth: 280, lineHeight: 1.5 }}>
                    {ROLE_DESCRIPTIONS[u.role]}
                  </td>
                  <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
