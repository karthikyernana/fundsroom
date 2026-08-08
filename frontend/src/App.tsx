import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';

// Customers
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';

// Products
import ProductList from './pages/products/ProductList';
import ProductDetail from './pages/products/ProductDetail';
import ProductForm from './pages/products/ProductForm';

// Challans
import ChallanList from './pages/challans/ChallanList';
import ChallanDetail from './pages/challans/ChallanDetail';
import ChallanForm from './pages/challans/ChallanForm';

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const CustomerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ProductIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
);
const ChallanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

// ─── AppShell ─────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const role = user?.role;

  const canSeeCustomers = role === 'admin' || role === 'sales' || role === 'accounts';
  const canSeeProducts = role === 'admin' || role === 'warehouse' || role === 'accounts';
  const canSeeChallans = true; // all roles

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item${isActive ? ' active' : ''}`;

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="sidebar-logo-title">FundsRoom</div>
            <div className="sidebar-logo-sub">Operations Portal</div>
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', color: '#fff', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-section-label">Workspace</div>

          <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <DashboardIcon /> Dashboard
          </NavLink>

          {canSeeCustomers && (
            <NavLink to="/customers" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <CustomerIcon /> Customers
            </NavLink>
          )}

          {canSeeProducts && (
            <NavLink to="/products" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <ProductIcon /> Products
            </NavLink>
          )}

          {canSeeChallans && (
            <NavLink to="/challans" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              <ChallanIcon /> Challans
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar" aria-hidden="true">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 'var(--sp1)', width: '100%', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px var(--sp3)', background: '#fff', borderBottom: '1px solid var(--border)' }} className="mobile-header">
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div style={{ marginLeft: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>FundsRoom Portal</div>
        </div>
        {children}
      </main>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
import { useCustomers } from './hooks/useCustomers';
import { useProducts } from './hooks/useProducts';
import { useChallans } from './hooks/useChallans';

function Dashboard() {
  const { user } = useAuth();
  const role = user?.role;

  const canSeeCustomers = role === 'admin' || role === 'sales' || role === 'accounts';
  const canSeeProducts = role === 'admin' || role === 'warehouse' || role === 'accounts';

  const { data: customerData } = useCustomers({ limit: 1 });
  const { data: productData } = useProducts({ limit: 1 });
  const { data: lowStockData } = useProducts({ low_stock: true, limit: 1 });
  const { data: challanData } = useChallans({ limit: 1 });
  const { data: draftChallanData } = useChallans({ status: 'draft', limit: 1 });

  const metrics = [
    { label: 'Active Customers', value: customerData?.meta.total ?? '—', color: 'var(--ledger)', visible: canSeeCustomers, to: '/customers' },
    { label: 'Total Products', value: productData?.meta.total ?? '—', color: 'var(--ledger)', visible: canSeeProducts, to: '/products' },
    { label: 'Low Stock Alerts', value: lowStockData?.meta.total ?? '—', color: 'var(--brick)', visible: canSeeProducts, to: '/products?low_stock=true' },
    { label: 'Total Challans', value: challanData?.meta.total ?? '—', color: 'var(--stamp)', visible: true, to: '/challans' },
    { label: 'Draft Challans', value: draftChallanData?.meta.total ?? '—', color: 'var(--stamp)', visible: true, to: '/challans?status=draft' },
  ].filter((m) => m.visible);

  const tiles = [
    { to: '/customers', icon: <CustomerIcon />, label: 'Customers CRM', desc: 'Manage lead and active customer relationships and follow-up timelines', visible: canSeeCustomers },
    { to: '/products', icon: <ProductIcon />, label: 'Inventory & Stock', desc: 'Track current stock levels, audit movements, and receive low-stock alerts', visible: canSeeProducts },
    { to: '/challans', icon: <ChallanIcon />, label: 'Sales Challans', desc: 'Draft, verify stock, and dispatch sales challans with transactional guarantees', visible: true },
  ].filter((t) => t.visible);

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '4px 12px', background: 'var(--ledger-dim)', color: 'var(--ledger)', borderRadius: 999, textTransform: 'capitalize', fontWeight: 600 }}>
          Role: {user?.role}
        </span>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp2)', marginBottom: 'var(--sp4)' }}>
        {metrics.map((m) => (
          <NavLink key={m.label} to={m.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'all 150ms ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: m.color, marginTop: 4 }}>
                {m.value}
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      {/* Module Navigation Tiles */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--sp2)', color: 'var(--ink)' }}>Operational Modules</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp3)' }}>
        {tiles.map((tile) => (
          <NavLink key={tile.to} to={tile.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 150ms, transform 150ms', height: '100%' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'; (e.currentTarget as HTMLDivElement).style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp2)', marginBottom: 'var(--sp2)' }}>
                <div style={{ width: 44, height: 44, background: 'var(--ledger)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {tile.icon}
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--ink)' }}>{tile.label}</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{tile.desc}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/" element={<Dashboard />} />

              {/* Customers — admin, sales, accounts */}
              {(role === 'admin' || role === 'sales' || role === 'accounts') && (
                <>
                  <Route path="/customers" element={<CustomerList />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  {(role === 'admin' || role === 'sales') && (
                    <>
                      <Route path="/customers/new" element={<CustomerForm />} />
                      <Route path="/customers/:id/edit" element={<CustomerForm />} />
                    </>
                  )}
                </>
              )}

              {/* Products — admin, warehouse, accounts */}
              {(role === 'admin' || role === 'warehouse' || role === 'accounts') && (
                <>
                  <Route path="/products" element={<ProductList />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  {(role === 'admin' || role === 'warehouse') && (
                    <>
                      <Route path="/products/new" element={<ProductForm />} />
                      <Route path="/products/:id/edit" element={<ProductForm />} />
                    </>
                  )}
                </>
              )}

              {/* Challans — all roles */}
              <Route path="/challans" element={<ChallanList />} />
              <Route path="/challans/:id" element={<ChallanDetail />} />
              {role !== 'accounts' && (
                <>
                  <Route path="/challans/new" element={<ChallanForm />} />
                  <Route path="/challans/:id/edit" element={<ChallanForm />} />
                </>
              )}

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
