// components/Button.jsx - Beginner-friendly reusable button component
import React from 'react';

/**
 * Reusable Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} isLoading - Shows loading spinner
 * @param {boolean} disabled - Disables click
 * @param {React.ReactNode} icon - Optional icon to display before text
 * @param {boolean} fullWidth - Expands to 100% width
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  className = '',
  id,
}) {
  // Styles for different variants
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    fontFamily: 'inherit',
    borderRadius: '12px',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.65 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    border: 'none',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    letterSpacing: '0.01em',
    userSelect: 'none',
  };

  const sizeStyles = {
    sm: { padding: '0.45rem 0.9rem', fontSize: '0.85rem' },
    md: { padding: '0.7rem 1.4rem', fontSize: '0.95rem' },
    lg: { padding: '0.9rem 1.8rem', fontSize: '1.05rem' },
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
    },
    secondary: {
      background: '#1e293b',
      color: '#f1f5f9',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    outline: {
      background: 'transparent',
      color: '#34d399',
      border: '1.5px solid #10b981',
    },
    danger: {
      background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 14px 0 rgba(244, 63, 94, 0.35)',
    },
    ghost: {
      background: 'transparent',
      color: '#94a3b8',
    },
  };

  return (
    <button
      id={id}
      type={type}
      onClick={disabled || isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      className={`btn-component ${className}`}
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(16, 185, 129, 0.55)';
          } else if (variant === 'secondary') {
            e.currentTarget.style.background = '#334155';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.39)';
          } else if (variant === 'secondary') {
            e.currentTarget.style.background = '#1e293b';
          }
        }
      }}
    >
      {isLoading ? (
        <>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
