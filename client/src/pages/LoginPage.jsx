// pages/LoginPage.jsx - Login and Registration Page with JWT
import React, { useState } from 'react';
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

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please try again.');
      }

      // Store JWT token in localStorage
      localStorage.setItem('food_app_token', data.token);
      localStorage.setItem('food_app_user', JSON.stringify(data.user));

      setSuccessMsg(data.message || 'Success! Redirecting...');
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
      }, 600);
    } catch (err) {
      setErrorMsg(err.message);
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
    <div
      style={{
        minHeight: 'calc(100vh - 70px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          position: 'relative',
        }}
      >
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

        <h1
          style={{
            textAlign: 'center',
            fontSize: '1.75rem',
            marginBottom: '0.35rem',
            color: '#ffffff',
          }}
        >
          {isRegister ? 'Create Your Account' : 'Welcome Back'}
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            marginBottom: '1.75rem',
          }}
        >
          {isRegister
            ? 'Sign up to track nutrients and analyze meals with Gemini Vision'
            : 'Sign in to access your nutritional scans and history'}
        </p>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.75rem',
          }}
        >
          <button
            type="button"
            id="tab-login"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              background: !isRegister ? '#1e293b' : 'transparent',
              color: !isRegister ? '#ffffff' : 'var(--text-muted)',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-register"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{
              flex: 1,
              padding: '0.6rem',
              border: 'none',
              background: isRegister ? '#1e293b' : 'transparent',
              color: isRegister ? '#ffffff' : 'var(--text-muted)',
              borderRadius: '9px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
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
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                }}
              >
                Full Name
              </label>
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
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
              }}
            >
              Email Address
            </label>
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
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
              }}
            >
              Password
            </label>
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
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
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
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
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
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-subtle)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline',
              }}
            >
              Continue as Guest (Explore Scanner)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
