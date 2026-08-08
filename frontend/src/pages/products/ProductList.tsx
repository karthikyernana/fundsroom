import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner, EmptyState, ErrorState } from '../../components/ui/States';
import { Pagination } from '../../components/ui/Pagination';

function StockCell({ stock, min }: { stock: number; min: number }) {
  const isLow = stock <= min;
  return (
    <span className={`mono ${isLow ? 'stock-low' : 'stock-normal'}`}>
      {stock}
      {isLow && (
        <span style={{ marginLeft: 6, fontSize: '0.7rem', background: 'var(--brick-light)', color: 'var(--brick)', padding: '1px 6px', borderRadius: 999, fontFamily: 'var(--font-sans)' }}>
          LOW
        </span>
      )}
    </span>
  );
}

export default function ProductList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canWrite = user?.role === 'admin' || user?.role === 'warehouse';

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useProducts({
    search: search || undefined,
    low_stock: lowStock || undefined,
    page,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Inventory</h1>
          <p className="page-subtitle">{data?.meta.total ?? 0} products</p>
        </div>
        {canWrite && (
          <button id="new-product-btn" className="btn btn-primary" onClick={() => navigate('/products/new')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Product
          </button>
        )}
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <div className="search-input-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="product-search" type="text" className="search-input"
              placeholder="Search name, SKU, category…"
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
          {search && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: lowStock ? 'var(--brick)' : 'var(--ink-muted)', fontWeight: lowStock ? 600 : 400 }}>
          <input
            id="low-stock-filter"
            type="checkbox"
            checked={lowStock}
            onChange={(e) => { setLowStock(e.target.checked); setPage(1); }}
            style={{ accentColor: 'var(--brick)', width: 16, height: 16 }}
          />
          Low stock only
        </label>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="state-container"><Spinner size="lg" /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.data.length ? (
          <EmptyState
            icon="📦"
            title={search || lowStock ? 'No products match' : 'No products yet'}
            message={canWrite ? 'Add your first product to start tracking inventory.' : undefined}
            action={canWrite ? (
              <button className="btn btn-primary" onClick={() => navigate('/products/new')}>Add Product</button>
            ) : undefined}
          />
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/products/${p.id}`)}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{p.category}</td>
                    <td className="mono">₹{Number(p.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td><StockCell stock={p.current_stock} min={p.min_stock_alert} /></td>
                    <td style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{p.location || '—'}</td>
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
