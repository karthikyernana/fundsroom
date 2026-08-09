import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Login failed. Check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--paper)',
      backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp3)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo / heading */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--sp5)', animation: 'loginEnter 400ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0ms' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'var(--ledger)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--sp2)',
            boxShadow: '0 4px 16px rgba(31,77,61,0.3)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', letterSpacing: '0.04em', color: 'var(--ink)', marginBottom: '4px' }}>
            FundsRoom
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.12em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
            Operations Portal
          </p>
        </div>

        {/* Login card */}
        <div className="card" style={{ padding: 'var(--sp4)', animation: 'loginEnter 400ms cubic-bezier(0.16,1,0.3,1) both', animationDelay: '60ms' }}>
          <h2 style={{ fontSize: '1.0625rem', marginBottom: 'var(--sp1)', color: 'var(--ink)' }}>Sign in</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 'var(--sp3)' }}>
            Enter your credentials to access your workspace.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--sp2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fundsroom.com"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--sp3)' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              id="login-submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 'var(--sp3)',
          padding: 'var(--sp2) var(--sp3)',
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(4px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          animation: 'loginEnter 400ms cubic-bezier(0.16,1,0.3,1) both',
          animationDelay: '120ms',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.08em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 'var(--sp1)' }}>
            Demo credentials
          </p>
          {[
            { role: 'admin', email: 'admin@fundsroom.com' },
            { role: 'sales', email: 'sales@fundsroom.com' },
            { role: 'warehouse', email: 'warehouse@fundsroom.com' },
            { role: 'accounts', email: 'accounts@fundsroom.com' },
          ].map((cred) => (
            <button
              key={cred.role}
              type="button"
              className="cred-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '7px var(--sp1)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ledger-dim)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              onClick={() => {
                setEmail(cred.email);
                setPassword('password123');
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ledger)' }}>
                {cred.email}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                padding: '2px 8px',
                background: 'var(--ledger-dim)',
                color: 'var(--ledger)',
                borderRadius: '999px',
                textTransform: 'capitalize',
                border: '1px solid rgba(31,77,61,0.15)'
              }}>
                {cred.role}
              </span>
            </button>
          ))}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--ink-faint)', marginTop: 'var(--sp1)' }}>
            All passwords: password123
          </p>
        </div>
      </div>
    </div>
  );
}
