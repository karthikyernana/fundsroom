import React from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
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

// Users (Admin only)
import UserManagement from './pages/users/UserManagement';

// Hooks for Dashboard
import { useCustomers } from './hooks/useCustomers';
import { useProducts } from './hooks/useProducts';
import { useChallans } from './hooks/useChallans';

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const CustomerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ProductIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);
const ChallanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// ─── AppShell ─────────────────────────────────────────────────────────────────
function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const role = user?.role;

  // Role-based nav visibility per PRD:
  // - Customers: admin, sales (write), accounts (read), warehouse (read — needed for challan dispatch context)
  // - Products:  admin, warehouse (write), accounts (read), sales (read — needed for stock visibility when creating challans)
  // - Challans:  all roles
  // - Users:     admin only
  const canSeeCustomers = role === 'admin' || role === 'sales' || role === 'accounts' || role === 'warehouse';
  const canSeeProducts  = role === 'admin' || role === 'warehouse' || role === 'accounts' || role === 'sales';
  const canSeeUsers     = role === 'admin';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item${isActive ? ' active' : ''}`;

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-title">FundsRoom</div>
            <div className="sidebar-logo-sub">Operations Portal</div>
          </div>
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

          <NavLink to="/challans" className={navLinkClass} onClick={() => setMobileOpen(false)}>
            <ChallanIcon /> Challans
          </NavLink>

          {canSeeUsers && (
            <>
              <div className="nav-section-label" style={{ marginTop: 'var(--sp2)' }}>Administration</div>
              <NavLink to="/users" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                <UsersIcon /> Users
              </NavLink>
            </>
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
            style={{ marginTop: 'var(--sp1)', width: '100%', color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        {/* Mobile header — only visible at ≤600px via CSS */}
        <div className="mobile-header">
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="mobile-brand">FundsRoom</div>
        </div>
        {children}
      </main>
    </div>
  );
}

// ─── Recent Challans mini-list ────────────────────────────────────────────────
function RecentChallanRow({ c, navigate }: { c: { id: string; challan_number: string; status: string; customer?: { name: string } | null; created_at: string }; navigate: (to: string) => void }) {
  return (
    <div
      onClick={() => navigate(`/challans/${c.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/challans/${c.id}`); } }}
      className="dispatch-row"
    >
      <div className="dispatch-row-primary">
        <div className="dispatch-number">{c.challan_number}</div>
        <div className="dispatch-customer">{c.customer?.name ?? '—'}</div>
      </div>
      <div className="dispatch-row-meta">
        <div className="dispatch-date">
          {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </div>
        <span className={`dispatch-status dispatch-status-${c.status}`}>{c.status}</span>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const canSeeCustomers = role === 'admin' || role === 'sales' || role === 'accounts' || role === 'warehouse';
  const canSeeProducts  = role === 'admin' || role === 'warehouse' || role === 'accounts' || role === 'sales';

  const { data: customerData } = useCustomers({ limit: 1 });
  const { data: myCustomerData } = useCustomers({ my_customers: true, limit: 1 });
  const { data: productData }  = useProducts({ limit: 1 });
  const { data: lowStockData } = useProducts({ low_stock: true, limit: 1 });
  const { data: challanData }  = useChallans({ limit: 5 });   // get 5 for recent activity
  const { data: draftChallanData } = useChallans({ status: 'draft', limit: 1 });

  const totalChallans = challanData?.meta.total ?? 0;
  const lowStock = lowStockData?.meta.total ?? 0;
  const recentChallans = challanData?.data ?? [];

  const metrics = [
    ...(role === 'sales' ? [{ label: 'My Customers', value: myCustomerData?.meta.total ?? '—', unit: 'assigned to me', tone: 'ledger', visible: true, to: '/customers?my_customers=true' }] : []),
    { label: 'All Customers', value: customerData?.meta.total ?? '—',    unit: 'total CRM records', tone: 'ledger', visible: canSeeCustomers, to: '/customers' },
    { label: 'Products',      value: productData?.meta.total ?? '—',      unit: 'in catalog',       tone: 'ledger', visible: canSeeProducts,  to: '/products'  },
    { label: 'Low Stock',     value: lowStock,                             unit: 'alert threshold',  tone: lowStock > 0 ? 'brick' : 'olive', visible: canSeeProducts, to: '/products?low_stock=true' },
    { label: 'Challans',      value: totalChallans,                        unit: 'total dispatches', tone: 'ledger', visible: true,            to: '/challans'  },
    { label: 'Draft Dispatches', value: draftChallanData?.meta.total ?? '—', unit: 'pending action', tone: 'stamp',  visible: true,            to: '/challans?status=draft'  },
  ].filter(m => m.visible);

  // ── Module quick-access tiles
  const tiles = [
    { to: '/customers', label: 'Customer CRM',      desc: 'Leads, active accounts, follow-up timeline & rep assignments', visible: canSeeCustomers },
    { to: '/products',  label: 'Inventory & Stock',  desc: 'Stock catalog, warehouse locations, and movement audit logs', visible: canSeeProducts },
    { to: '/challans',  label: 'Sales Challans',     desc: 'Draft, confirm, and review outbound dispatches', visible: true },
  ].filter(t => t.visible);

  return (
    <div className="main-content dashboard-page">
      <div className="dashboard-header">
        <div>
          <div className="eyebrow">Operations desk</div>
          <h1 className="page-title">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · live operational picture</p>
        </div>
        <div className="role-chip">
          {user?.role}
        </div>
      </div>

      <div className="metric-grid">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`metric-card metric-card-${m.tone}`}
            style={{ animationDelay: `${i * 45}ms` }}
            onClick={() => navigate(m.to)}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(m.to); } }}
          >
            <span className="metric-label">{m.label}</span>
            <div className="metric-value">{m.value}</div>
            <div className="metric-unit">{m.unit}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">

        {/* Left: Recent Challans */}
        <div className="card dispatch-panel">
          <div className="card-header">
            <div>
              <h2 className="section-title">Recent dispatches</h2>
              <div className="section-subtitle">Latest paperwork leaving the warehouse</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/challans')}>View all</button>
          </div>
          {recentChallans.length === 0 ? (
            <div className="dashboard-empty">
              No challans created yet.
            </div>
          ) : (
            <div className="dispatch-list">
              {recentChallans.map(c => (
                <RecentChallanRow key={c.id} c={c} navigate={navigate} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick links + low-stock alert */}
        <div className="dashboard-side">
          {tiles.map((tile, i) => (
            <div
              key={tile.to}
              className="module-tile dashboard-module-tile"
              onClick={() => navigate(tile.to)}
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(tile.to); } }}
              style={{ animationDelay: `${180 + i * 45}ms` }}
            >
              <div className="module-tile-label">{tile.label}</div>
              <div className="module-tile-desc">{tile.desc}</div>
            </div>
          ))}

          {/* Low stock alert callout */}
          {canSeeProducts && lowStock > 0 && (
            <div
              onClick={() => navigate('/products?low_stock=true')}
              role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/products?low_stock=true'); } }}
              className="stock-callout"
            >
              <div className="stock-callout-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor" strokeWidth="3"/></svg>
                {lowStock} low stock {lowStock === 1 ? 'alert' : 'alerts'}
              </div>
              <div className="stock-callout-copy">Items require warehouse replenishment</div>
            </div>
          )}
        </div>
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

              {/* Customers — admin, sales (write), accounts + warehouse (read) */}
              {(role === 'admin' || role === 'sales' || role === 'accounts' || role === 'warehouse') && (
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

              {/* Products — admin, warehouse (write), accounts + sales (read) */}
              {(role === 'admin' || role === 'warehouse' || role === 'accounts' || role === 'sales') && (
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

              {/* Users — admin only */}
              {role === 'admin' && (
                <Route path="/users" element={<UserManagement />} />
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
