// AuthContext.jsx
//
// Provides authentication state to the entire React tree.
// Wraps the in-memory token store from axiosInstance.js so that
// React components re-render when auth state changes.
//
// Design decisions:
//  - React state (isAuthenticated, username, tokenExpiration) drives
//    routing and UI — it is the "view" of the token store.
//  - The actual access token lives in the axiosInstance module (not in
//    React state) so it is available to the axios interceptor synchronously,
//    without closures over stale state.
//  - The refresh token is stored in an HttpOnly cookie managed by the server.
//  - On page reload, the access token is gone but the cookie persists.
//    AuthProvider silently calls /renovar on mount to recover the session.

import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    setTokens,
    clearTokens,
} from '../services/axiosInstance';
import { logout as apiLogout, refreshAccessToken } from '../services/authApi';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState(null);
    const [tokenExpiration, setTokenExpiration] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [iniciando, setIniciando] = useState(true);

    // -----------------------------------------------------------
    // Silent session recovery on mount
    // Calls /renovar — the HttpOnly cookie is sent automatically.
    // While iniciando, renders null to prevent ProtectedRoute from
    // redirecting to /login before the refresh completes.
    // -----------------------------------------------------------
    useEffect(() => {
        const recuperarSesion = async () => {
            try {
                const data = await refreshAccessToken();
                setTokens(data.accessToken);
                setIsAuthenticated(true);
                setUsername(data.username ?? null);
                setTokenExpiration(data.tokenExpiration ?? null);
            } catch {
                // Cookie absent or expired — remain unauthenticated, silently.
            } finally {
                setIniciando(false);
            }
        };
        recuperarSesion();
    }, []);

    // -----------------------------------------------------------
    // Sync React state when the axios interceptor silently refreshes tokens
    // -----------------------------------------------------------
    useEffect(() => {
        function handleTokensRefreshed(event) {
            const { tokenExpiration: newExpiry } = event.detail;
            setTokenExpiration(newExpiry);
            setIsAuthenticated(true);
        }

        function handleSessionExpired() {
            setIsAuthenticated(false);
            setUsername(null);
            setTokenExpiration(null);
        }

        window.addEventListener('tokens-refreshed', handleTokensRefreshed);
        window.addEventListener('session-expired', handleSessionExpired);
        return () => {
            window.removeEventListener('tokens-refreshed', handleTokensRefreshed);
            window.removeEventListener('session-expired', handleSessionExpired);
        };
    }, []);

    // -----------------------------------------------------------
    // login — called by LoginPage after a successful /entrar response
    // -----------------------------------------------------------
    const login = useCallback((jwtResponse, loggedInUsername) => {
        setTokens(jwtResponse.accessToken);
        setIsAuthenticated(true);
        setUsername(loggedInUsername);
        setTokenExpiration(jwtResponse.tokenExpiration);
    }, []);

    // -----------------------------------------------------------
    // logout — calls /pechar then clears everything
    // -----------------------------------------------------------
    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            // Best-effort call — if it fails we still clear local state
            await apiLogout();
        } catch (err) {
            // Server-side logout failed (e.g. cookie already expired).
            console.warn('[AuthContext] Server logout call failed:', err.message);
        } finally {
            clearTokens();
            setIsAuthenticated(false);
            setUsername(null);
            setTokenExpiration(null);
            setIsLoggingOut(false);
        }
    }, []);

    const value = useMemo(
        () => ({
            isAuthenticated,
            username,
            tokenExpiration,
            isLoggingOut,
            login,
            logout,
        }),
        [isAuthenticated, username, tokenExpiration, isLoggingOut, login, logout],
    );

    if (iniciando) return null;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
