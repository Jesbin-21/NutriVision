
// components/Button.jsx - Reusable button component

import React from 'react';
import './Button.css';

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
  const buttonClass = `
    btn-component
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full-width' : ''}
    ${className}
  `;

  return (
    <button
      id={id}
      type={type}
      onClick={disabled || isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      className={buttonClass}
    >
      {isLoading ? (
        <>
          <span className="btn-spinner" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

