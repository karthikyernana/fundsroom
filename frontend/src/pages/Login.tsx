import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ─── Unified Canonical FundsRoom Logo Mark ────────────────────────────────────
const LogoMark = ({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          ?.response?.data?.error?.message ?? 'Invalid credentials. Please verify your email and password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-split-wrapper">
        
        <div className="login-hero-panel">
          <div className="login-hero-pattern" />

          <div className="login-hero-header">
            <div className="login-hero-logo-box">
              <LogoMark size={26} color="#FFFFFF" />
            </div>
            <div>
              <span className="login-hero-brand">
                FUNDSROOM
              </span>
              <span className="login-hero-brand-subtitle">
                Operations Portal
              </span>
            </div>
          </div>

          <div className="login-hero-content">
            <h1 className="login-hero-headline">
              One ledger for<br />
              every dispatch.
            </h1>

            <p className="login-hero-subhead">
              A focused workspace for customer follow-ups, warehouse stock, and the paperwork that moves goods out the door.
            </p>
          </div>

          <div className="login-hero-footer">
            <span>
              Internal operations workspace
            </span>
            <span>
              Authorized access only
            </span>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-box">
            
            <div className="login-mobile-brand">
              <div className="login-brand-icon">
                <LogoMark size={24} color="#FFFFFF" />
              </div>
              <div>
                <h1 className="login-brand-title">FUNDSROOM</h1>
                <p className="login-brand-subtitle">Operations Portal</p>
              </div>
            </div>

            <div className="login-card">
              <div className="eyebrow">Secure sign in</div>
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">Use the account assigned to your operations role.</p>

              {error && (
                <div className="alert alert-error login-error-shake" style={{ marginBottom: 'var(--sp3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} id="login-form">
                <div className="login-input-group">
                  <label htmlFor="email">Work Email</label>
                  <div className="login-input-wrapper">
                    <input
                      id="email"
                      type="email"
                      className="login-input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@fundsroom.com"
                      autoComplete="email"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="login-input-group" style={{ marginBottom: 'var(--sp4)' }}>
                  <label htmlFor="password">Password</label>
                  <div className="login-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input-field"
                      style={{ paddingRight: '44px' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit"
                  className="login-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF' }} />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <span>Sign in to Workspace</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
