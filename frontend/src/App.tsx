import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';

// Phase 3 — these will be real implementations
const Dashboard = () => (
  <div className="main-content">
    <div className="page-header">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome to FundsRoom Operations Portal</p>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp2)' }}>
      {['Customers', 'Products', 'Challans'].map((m) => (
        <div key={m} className="card">
          <h3 style={{ color: 'var(--ledger)', marginBottom: 'var(--sp1)' }}>{m}</h3>
          <p style={{ fontSize: '0.875rem' }}>Module coming in Phase 3</p>
        </div>
      ))}
    </div>
  </div>
);

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">FundsRoom</div>
          <div className="sidebar-logo-sub">Operations Portal</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          <a href="/" className="nav-item active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          {(user?.role === 'admin' || user?.role === 'sales' || user?.role === 'accounts') && (
            <a href="/customers" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Customers
            </a>
          )}
          {(user?.role === 'admin' || user?.role === 'warehouse' || user?.role === 'accounts') && (
            <a href="/products" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              Products
            </a>
          )}
          {(user?.role !== 'accounts') && (
            <a href="/challans" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Challans
            </a>
          )}
          {user?.role === 'accounts' && (
            <a href="/challans" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Challans
            </a>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
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
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<Dashboard />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
