// pages/LoginPage.jsx - Login and Registration Page with JWT
import React, { useState } from 'react';
import axios from 'axios';
import Button from '../components/Button';
import { Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onGuestContinue }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Form Submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMsg('');
  setSuccessMsg('');

  if (isRegister && !name.trim()) {
    setErrorMsg('Please enter your full name.');
    return;
  }

  if (!email.trim() || !password) {
    setErrorMsg('Please enter both email and password.');
    return;
  }

  setIsLoading(true);

  try {
    const response = await axios.post(
      isRegister
        ? `${import.meta.env.VITE_API_URL}/api/auth/register`
        : `${import.meta.env.VITE_API_URL}/api/auth/login`,
      isRegister
        ? { name, email, password }
        : { email, password }
    );

    const data = response.data;

    if (!data.success) {
      throw new Error(data.message || 'Authentication failed. Please try again.');
    }

    localStorage.setItem('food_app_token', data.token);
    localStorage.setItem('food_app_user', JSON.stringify(data.user));

    setSuccessMsg(data.message || 'Success! Redirecting...');

    setTimeout(() => {
      onLoginSuccess(data.user, data.token);
    }, 600);
  } catch (err) {
    setErrorMsg(
      err.response?.data?.message ||
      err.message ||
      'Authentication failed. Please try again.'
    );
  } finally {
    setIsLoading(false);
  }
};

  // Quick autofill to make testing effortless
  const handleQuickFill = () => {
    setName('Alex Healthy');
    setEmail('alex@example.com');
    setPassword('nutrivision123');
    setErrorMsg('');
  };

  return (
    <>
      {/* Responsive styles injected via <style> tag */}
      <style>{`
        .login-page-wrapper {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 460px;
          padding: 2.5rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-title {
          text-align: center;
          font-size: 1.75rem;
          margin-bottom: 0.35rem;
          color: #ffffff;
        }

        .login-subtitle {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.75rem;
        }

        .login-tab-switcher {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 1.75rem;
        }

        .login-tab-btn {
          flex: 1;
          padding: 0.6rem;
          border: none;
          border-radius: 9px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .login-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.6rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: #ffffff;
          font-size: 0.92rem;
          outline: none;
          box-sizing: border-box;
        }

        .login-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 0.35rem;
        }

        .login-footer {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .login-guest-btn {
          background: transparent;
          border: none;
          color: var(--text-subtle);
          font-size: 0.85rem;
          cursor: pointer;
          text-align: center;
          text-decoration: underline;
          padding: 0.25rem;
          min-height: 44px;
        }

        /* ── Mobile (≤ 480px) ── */
        @media (max-width: 480px) {
          .login-page-wrapper {
            padding: 1rem 0.75rem;
            align-items: flex-start;
            padding-top: 1.5rem;
          }

          .login-card {
            padding: 1.5rem 1.1rem;
            border-radius: 16px;
          }

          .login-title {
            font-size: 1.4rem;
          }

          .login-subtitle {
            font-size: 0.82rem;
            margin-bottom: 1.25rem;
          }

          .login-tab-switcher {
            margin-bottom: 1.25rem;
          }

          .login-tab-btn {
            font-size: 0.82rem;
            padding: 0.5rem 0.25rem;
          }

          .login-input {
            font-size: 1rem; /* prevents iOS zoom on focus */
            padding: 0.7rem 1rem 0.7rem 2.4rem;
          }

          .login-label {
            font-size: 0.8rem;
          }

          .login-footer {
            margin-top: 1.1rem;
            padding-top: 1rem;
          }

          .login-guest-btn {
            font-size: 0.8rem;
          }
        }

        /* ── Very small phones (≤ 360px) ── */
        @media (max-width: 360px) {
          .login-card {
            padding: 1.25rem 0.9rem;
          }

          .login-title {
            font-size: 1.25rem;
          }
        }
      `}</style>

      <div className="login-page-wrapper">
        <div className="glass-card login-card">
          {/* Glow ambient background element */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              background: 'rgba(16, 185, 129, 0.2)',
              filter: 'blur(40px)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />

          {/* Header Icon */}
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#34d399',
            }}
          >
            <Lock size={26} />
          </div>

          <h1 className="login-title">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="login-subtitle">
            {isRegister
              ? 'Sign up to track nutrients and analyze meals with Gemini Vision'
              : 'Sign in to access your nutritional scans and history'}
          </p>

          {/* Tab Switcher */}
          <div className="login-tab-switcher">
            <button
              type="button"
              id="tab-login"
              className="login-tab-btn"
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: !isRegister ? '#1e293b' : 'transparent',
                color: !isRegister ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              id="tab-register"
              className="login-tab-btn"
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              style={{
                background: isRegister ? '#1e293b' : 'transparent',
                color: isRegister ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              Register
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div
              id="auth-error-msg"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              id="auth-success-msg"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {isRegister && (
              <div>
                <label className="login-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-subtle)',
                    }}
                  >
                    <User size={18} />
                  </span>
                  <input
                    id="input-name"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="login-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                >
                  <Mail size={18} />
                </span>
                <input
                  id="input-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            <div>
              <label className="login-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-subtle)',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  id="input-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <Button
                id="btn-auth-submit"
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
                icon={<ShieldCheck size={18} />}
              >
                {isRegister ? 'Create Account' : 'Sign In'}
              </Button>
            </div>
          </form>

          {/* Quick Demo Autofill Helper */}
          <div className="login-footer">
            <Button
              id="btn-quick-fill"
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleQuickFill}
              icon={<Sparkles size={14} color="#34d399" />}
              fullWidth
            >
              Auto-Fill Demo Credentials
            </Button>

            {onGuestContinue && (
              <button
                type="button"
                id="btn-continue-guest"
                onClick={onGuestContinue}
                className="login-guest-btn"
              >
                Continue as Guest (Explore Scanner)
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
