// DashboardPage.jsx
//
// Protected page — only reachable if authenticated (ProtectedRoute wraps it).
// Shows:
//   - Welcome message with the logged-in username
//   - Token expiration time from JwtResponseDTO
//   - Sprint 1 debug section with truncated token values
//
// The debug section MUST be removed before any production deployment.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getAccessToken, getRefreshToken } from '../services/axiosInstance';
import '../assets/styles/dashboard.css';

// Truncate a token string for safe display — never log full tokens
function truncate(token, head = 20, tail = 10) {
    if (!token) return '—';
    if (token.length <= head + tail + 3) return token;
    return `${token.slice(0, head)}…${token.slice(-tail)}`;
}

function formatExpiry(isoString) {
    if (!isoString) return 'Unknown';
    try {
        return new Date(isoString).toLocaleString();
    } catch {
        return isoString;
    }
}

export default function DashboardPage() {
    const { username, tokenExpiration, isLoggingOut, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="dashboard">
            {/* ---- Topbar ---- */}
            <header className="dashboard__topbar">
                <div className="dashboard__brand">
                    <div className="dashboard__brand-dot" />
                    Explora Map
                </div>
                <button
                    className="dashboard__logout"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? 'Logging out…' : 'Log out'}
                </button>
            </header>

            {/* ---- Main content ---- */}
            <main className="dashboard__main">
                {/* Welcome card */}
                <section className="dashboard__welcome">
                    <h1 className="dashboard__welcome-heading">
                        Welcome, <span>{username || 'traveller'}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-md)' }}>
                        You are authenticated. Your maps are ready.
                    </p>
                    <div className="dashboard__expiry">
                        <span className="dashboard__expiry-dot" />
                        Token expires: {formatExpiry(tokenExpiration)}
                    </div>
                </section>

                {/* Auth status + debug info */}
                <section className="dashboard__auth-status">
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', letterSpacing: '-0.01em' }}>
                        Authentication status
                    </h2>

                    {/* --------------------------------------------------------
              SPRINT 1 DEBUG INFO — REMOVE BEFORE PRODUCTION
              Displays truncated token values to confirm the full
              auth flow is working end-to-end against the backend.
              -------------------------------------------------------- */}
                    <div className="debug-banner" aria-label="Debug information — Sprint 1 only">
                        ⚠ Sprint 1 debug info — remove before production
                    </div>

                    <table className="token-table">
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Status</td>
                                <td>
                                    <span className="status-ok">● Authenticated</span>
                                </td>
                            </tr>
                            <tr>
                                <td>Username</td>
                                <td>
                                    <span className="token-value">{username || '—'}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>Token expiry</td>
                                <td>
                                    <span className="token-value">{formatExpiry(tokenExpiration)}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>Access token</td>
                                <td>
                                    <span className="token-value">{truncate(getAccessToken())}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>Refresh token</td>
                                <td>
                                    <span className="token-value">{truncate(getRefreshToken())}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {/* END SPRINT 1 DEBUG INFO */}
                </section>
            </main>
        </div>
    );
}