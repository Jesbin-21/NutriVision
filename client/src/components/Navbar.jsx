
// components/Navbar.jsx

import React from 'react';
import Button from './Button';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';

import './Navbar.css';

export default function Navbar({
  user,
  onLogout,
  onNavigateToLogin,
  activePage,
}) {
  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* Brand */}
        <div className="navbar-brand">

          {/* Logo */}
          <div className="navbar-logo">
            <Sparkles className="navbar-logo-icon" />
          </div>

          {/* Brand text */}
          <div className="navbar-brand-text">
            <div className="navbar-title">
              <span>
                Nutri<span className="navbar-title-highlight">Vision</span>
              </span>
            </div>

            {/* Hide tagline on mobile */}
            <p className="navbar-tagline">
              Smart Food & Nutrient Scanner
            </p>
          </div>
        </div>

        {/* User / Actions */}
        <div className="navbar-actions">

          {user ? (
            <>
              {/* User information */}
              <div className="navbar-user">

                {/* Avatar */}
                <div className="navbar-avatar">
                  <UserIcon size={16} />
                </div>

                {/* User text */}
                <div className="navbar-user-text">
                  <span className="navbar-user-name">
                    {user.name}
                  </span>

                  {/* Hide email on smaller screens */}
                  <span className="navbar-user-email">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <Button
                id="btn-logout"
                variant="secondary"
                size="sm"
                onClick={onLogout}
                icon={<LogOut size={16} />}
              >
                <span className="logout-text">
                  Logout
                </span>
              </Button>
            </>
          ) : (
            <Button
              id="btn-nav-login"
              variant="primary"
              size="sm"
              onClick={onNavigateToLogin}
              icon={<ShieldCheck size={16} />}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

