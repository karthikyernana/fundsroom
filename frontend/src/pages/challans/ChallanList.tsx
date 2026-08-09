import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallans } from '../../hooks/useChallans';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';
import { StampBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChallanList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role !== 'accounts';

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useChallans({
    status: status || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans</h1>
          <p className="page-subtitle">{data?.meta.total ?? 0} challans</p>
        </div>
        {canCreate && (
          <button id="new-challan-btn" className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Challan
          </button>
        )}
      </div>

      <div className="toolbar">
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'draft', 'confirmed', 'cancelled'].map((s) => (
            <button key={s} type="button"
              className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setStatus(s); setPage(1); }}
              id={`filter-${s || 'all'}`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="state-container"><Spinner size="lg" /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState title={status ? `No ${status} challans` : 'No challans yet'}
            action={canCreate ? <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>Create Challan</button> : undefined} />
        ) : (
          <>
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total Qty</th>
                  <th>Date</th>
                  <th>Created by</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/challans/${c.id}`)}>
                    <td className="mono" style={{ fontWeight: 600 }}>{c.challan_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.customer?.name}</div>
                      {c.customer?.business_name && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{c.customer.business_name}</div>
                      )}
                    </td>
                    <td><StampBadge status={c.status} /></td>
                    <td className="mono">{c._count?.challan_items ?? 0}</td>
                    <td className="mono">{c.total_quantity}</td>
                    <td className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{formatDate(c.created_at)}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{c.creator?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.meta.totalPages > 1 && (
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages}
                total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
