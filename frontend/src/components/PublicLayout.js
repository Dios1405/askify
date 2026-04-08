import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChatWidget from './ChatWidget';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="public-layout">
      <nav className="public-navbar">
        <Link to="/" className="public-brand">
          Askify <span>Community</span>
        </Link>
        <div className="public-nav-actions">
          <button className="btn-icon" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <Link to="/app" className="btn btn-secondary btn-sm">Dashboard</Link>
              <button className="btn btn-secondary btn-sm" onClick={logout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main className="public-content">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
