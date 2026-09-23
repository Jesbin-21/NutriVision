// App.jsx - Main Application Controller
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import './app.css'
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('food_app_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('food_app_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('food_app_token') ? 'dashboard' : 'login';
  });

  // Verify token on load if available
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setCurrentPage('dashboard');
          } else {
            // Token is invalid/expired
            handleLogout();
          }
        })
        .catch(() => {
          // If offline/error keep cached user or allow fallback
        });
    }
  }, [token]);

  const handleLoginSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('food_app_token');
    localStorage.removeItem('food_app_user');
    setToken('');
    setUser(null);
    setCurrentPage('login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigateToLogin={() => setCurrentPage('login')}
        activePage={currentPage}
      />

      <main style={{ flex: 1 }}>
        {currentPage === 'login' ? (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onGuestContinue={() => setCurrentPage('dashboard')}
          />
        ) : (
          <DashboardPage
            user={user}
            token={token}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        NutriVision AI • Powered by Google Gemini Vision, Express, JWT &amp; React
      </footer>
    </div>
  );
}
