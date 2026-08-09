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

// ─── Animated Architectural Vault Geometry Artwork for Hero Panel ─────────────
const HeroVaultArtwork = () => (
  <div className="login-hero-artwork">
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="95" stroke="rgba(226,217,200,0.12)" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="100" cy="100" r="75" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="55" stroke="rgba(226,217,200,0.25)" strokeWidth="1" strokeDasharray="6 6" />
      <rect x="60" y="60" width="80" height="80" rx="12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" transform="rotate(45 100 100)" />
      <rect x="70" y="70" width="60" height="60" rx="8" stroke="rgba(226,217,200,0.4)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="16" fill="rgba(255,255,255,0.15)" stroke="#E2D9C8" strokeWidth="2" />
      <circle cx="100" cy="100" r="5" fill="#FFFFFF" />
    </svg>
  </div>
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
        
        {/* ───────────────────────────────────────────────────────────────────
            LEFT HERO SHOWCASE PANEL (Single Authoritative Logo for Desktop)
        ─────────────────────────────────────────────────────────────────── */}
        <div className="login-hero-panel">
          {/* Subtle Banknote/Ledger background mesh pattern & floating ambient orbs */}
          <div className="login-hero-pattern" />
          <div className="login-hero-glow-1" />
          <div className="login-hero-glow-2" />

          {/* Top Brand Logo Header (DESKTOP SINGLE LOGO) */}
          <div className="login-hero-header">
            <div className="login-hero-logo-box">
              <LogoMark size={26} color="#FFFFFF" />
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-brand)', fontWeight: 800, fontSize: '1.375rem', letterSpacing: '0.08em', color: '#FFFFFF', display: 'block', lineHeight: 1 }}>
                FUNDSROOM
              </span>
              <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.14em', color: '#E2D9C8', textTransform: 'uppercase', marginTop: '4px' }}>
                Operations Portal
              </span>
            </div>
          </div>

          {/* Central Hero Artwork & High-Craft Content */}
          <div className="login-hero-content">
            <HeroVaultArtwork />

            <h1 className="login-hero-headline">
              Precision Stock &amp; <br />
              <span className="login-hero-serif">Financial Control</span>
            </h1>

            <p className="login-hero-subhead">
              Enterprise Logistics &amp; Operations Portal for internal stock audit, dispatch authorization, and real-time inventory management.
            </p>
          </div>

          {/* Abstract System Status Footer */}
          <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 'var(--sp3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              FundsRoom Enterprise v1.0
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#E2D9C8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="login-hero-badge-pulse" style={{ width: 6, height: 6 }} />
              System Status: Active
            </span>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            RIGHT SIGN-IN FORM PANEL (Parchment Tone #EDE7DA)
        ─────────────────────────────────────────────────────────────────── */}
        <div className="login-form-panel">
          <div className="login-form-box">
            
            {/* Mobile-Only Logo Header (Hidden on Desktop to prevent duplicate logos) */}
            <div className="login-mobile-brand">
              <div className="login-brand-icon">
                <LogoMark size={24} color="#FFFFFF" />
              </div>
              <div>
                <h1 className="login-brand-title">FUNDSROOM</h1>
                <p className="login-brand-subtitle">Operations Portal</p>
              </div>
            </div>

            {/* Login Card */}
            <div className="login-card">
              <h2 className="login-title">Sign in to Portal</h2>
              <p className="login-subtitle">Enter your corporate credentials to continue.</p>

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
                      tabIndex={-1}
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
