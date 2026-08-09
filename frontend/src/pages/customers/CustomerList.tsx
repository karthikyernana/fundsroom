import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import { useSalesReps } from '../../hooks/useSalesReps';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

export default function CustomerList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Only admin and sales can write — warehouse and accounts see read-only
  const canWrite = user?.role === 'admin' || user?.role === 'sales';

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [myCustomers, setMyCustomers] = useState(searchParams.get('my_customers') === 'true');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');

  const { data: salesReps } = useSalesReps();

  const { data, isLoading, isError, error, refetch } = useCustomers({
    search: search || undefined,
    status: status || undefined,
    assigned_to: assignedTo || undefined,
    my_customers: myCustomers || undefined,
    page,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleMyCustomersToggle = (val: boolean) => {
    setMyCustomers(val);
    setPage(1);
    if (val) {
      setSearchParams({ my_customers: 'true' });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">
            {data?.meta.total ?? 0} total customer accounts
          </p>
        </div>
        {canWrite && (
          <button
            id="new-customer-btn"
            className="btn btn-primary"
            onClick={() => navigate('/customers/new')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Customer
          </button>
        )}
      </div>

      {/* Filter Tabs for Sales Reps */}
      {user?.role === 'sales' && (
        <div style={{ display: 'flex', gap: 'var(--sp1)', marginBottom: 'var(--sp2)' }}>
          <button
            type="button"
            className={`btn btn-sm ${!myCustomers ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleMyCustomersToggle(false)}
          >
            All Accounts
          </button>
          <button
            type="button"
            className={`btn btn-sm ${myCustomers ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleMyCustomersToggle(true)}
          >
            My Assigned Accounts
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: 'var(--sp2)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="customer-search"
              type="text"
              className="search-input"
              placeholder="Search name, mobile, GST…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
          {search && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>

        <select
          id="status-filter"
          className="form-select"
          style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="lead">Lead</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          id="sales-rep-filter"
          className="form-select"
          style={{ width: 'auto', padding: '8px 36px 8px 12px' }}
          value={assignedTo}
          onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
        >
          <option value="">All Sales Reps</option>
          {salesReps?.map((rep) => (
            <option key={rep.id} value={rep.id}>
              {rep.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="state-container"><Spinner size="lg" /></div>
        ) : isError ? (
          <ErrorState
            message={(error as { message?: string })?.message}
            onRetry={() => refetch()}
          />
        ) : !data?.data.length ? (
          <EmptyState
            icon=""
            title={search || myCustomers ? 'No matching customer accounts' : 'No customers yet'}
            message={search || myCustomers ? 'Try clearing your search or assigned account filters.' : 'Add your first customer account to get started.'}
            action={canWrite ? (
              <button className="btn btn-primary" onClick={() => navigate('/customers/new')}>
                Add Customer
              </button>
            ) : undefined}
          />
        ) : (
          <>
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Name / Business</th>
                  <th>Mobile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assigned Sales Rep</th>
                  <th>Follow-up</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/customers/${c.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.business_name && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{c.business_name}</div>
                      )}
                    </td>
                    <td className="mono">{c.mobile}</td>
                    <td><Badge variant={c.customer_type}>{c.customer_type}</Badge></td>
                    <td><Badge variant={c.status}>{c.status}</Badge></td>
                    <td>
                      {c.assigned_salesperson ? (
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ledger)' }}>
                          {c.assigned_salesperson.name}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                      {c.follow_up_date
                        ? new Date(c.follow_up_date).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>
                      {c._count?.customer_notes ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.meta.totalPages > 1 && (
              <Pagination
                page={data.meta.page}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                limit={data.meta.limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
