// DashboardPage.jsx
//
// Protected page — only reachable if authenticated (ProtectedRoute wraps it).
// Shows a welcome message and quick links to the main Sprint 3 sections.

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../assets/styles/dashboard.css';

export default function DashboardPage() {
    const { username, tokenExpiration, isLoggingOut, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login', { replace: true });
    }

    function formatExpiry(isoString) {
        if (!isoString) return 'Unknown';
        try {
            return new Date(isoString).toLocaleString();
        } catch {
            return isoString;
        }
    }

    return (
        <div className="dashboard">
            {/* ---- Topbar ---- */}
            <header className="dashboard__topbar">
                <div className="dashboard__brand">
                    <div className="dashboard__brand-dot" />
                    Explora Map
                </div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link
                        to="/mapas"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-primary)';
                            e.currentTarget.style.background = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        Os meus mapas
                    </Link>
                    <Link
                        to="/convites"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            color: 'var(--color-text-secondary)',
                            textDecoration: 'none',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 150ms, background 150ms',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-primary)';
                            e.currentTarget.style.background = 'var(--color-primary-light)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        Convites
                    </Link>
                    <button
                        className="dashboard__logout"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? 'Logging out…' : 'Log out'}
                    </button>
                </nav>
            </header>

            {/* ---- Main content ---- */}
            <main className="dashboard__main">
                {/* Welcome card */}
                <section className="dashboard__welcome">
                    <h1 className="dashboard__welcome-heading">
                        Welcome, <span>{username || 'traveller'}</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
                        You are authenticated. Your maps are ready.
                    </p>
                    <div className="dashboard__expiry">
                        <span className="dashboard__expiry-dot" />
                        Token expires: {formatExpiry(tokenExpiration)}
                    </div>
                </section>

                {/* Quick navigation */}
                <section className="dashboard__auth-status">
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', letterSpacing: '-0.01em' }}>
                        Quick navigation
                    </h2>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <Link
                            to="/mapas"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-3) var(--space-6)',
                                background: 'var(--color-primary)',
                                color: '#fff',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                textDecoration: 'none',
                                transition: 'background 150ms',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary)')}
                        >
                            Os meus mapas
                        </Link>
                        <Link
                            to="/convites"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-3) var(--space-6)',
                                background: 'var(--color-primary-light)',
                                color: 'var(--color-primary)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                textDecoration: 'none',
                                transition: 'background 150ms',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#ddd6fe')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-primary-light)')}
                        >
                            Convites
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
