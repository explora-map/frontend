// AuthContext.jsx
//
// Provides authentication state to the entire React tree.
// Wraps the in-memory token store from axiosInstance.js so that
// React components re-render when auth state changes.
//
// Design decisions:
//  - React state (isAuthenticated, username, tokenExpiration) drives
//    routing and UI — it is the "view" of the token store.
//  - The actual tokens live in the axiosInstance module (not in React
//    state) so they are available to the axios interceptor synchronously,
//    without closures over stale state.
//  - On page reload, in-memory tokens are gone → user must log in again.
//    This is intentional for security (no persistent token in the browser).

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
    getUsername,
    getTokenExpiration,
    isAuthenticated as tokenStoreIsAuthenticated,
} from '../services/axiosInstance';
import { logout as apiLogout } from '../services/authApi';
import { getRefreshToken } from '../services/axiosInstance';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Derive initial state from the token store.
    // On first mount after a page reload, the store is empty → not authenticated.
    const [isAuthenticated, setIsAuthenticated] = useState(
        () => tokenStoreIsAuthenticated(),
    );
    const [username, setUsername] = useState(() => getUsername() || null);
    const [tokenExpiration, setTokenExpiration] = useState(
        () => getTokenExpiration() || null,
    );
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        setTokens({
            accessToken: jwtResponse.accessToken,
            refreshToken: jwtResponse.refreshToken,
            tokenExpiration: jwtResponse.tokenExpiration,
            username: loggedInUsername,
        });
        setIsAuthenticated(true);
        setUsername(loggedInUsername);
        setTokenExpiration(jwtResponse.tokenExpiration);
    }, []);

    // -----------------------------------------------------------
    // logout — calls /logout then clears everything
    // -----------------------------------------------------------
    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        const storedRefreshToken = getRefreshToken();

        try {
            if (storedRefreshToken) {
                // Best-effort call — if it fails we still clear local state
                await apiLogout(storedRefreshToken);
            }
        } catch (err) {
            // Server-side logout failed (e.g. already expired).
            // We still clear local tokens — the user is considered logged out.
            console.warn('[AuthContext] Server logout call failed:', err.message);
        } finally {
            clearTokens();
            setIsAuthenticated(false);
            setUsername(null);
            setTokenExpiration(null);
            setIsLoggingOut(false);
        }
    }, []);

    // Memoize context value to avoid unnecessary re-renders of consumers
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

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}