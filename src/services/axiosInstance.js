// axiosInstance.js
//
// Axios instance pre-configured with:
//  1. Authorization header injection from in-memory token store
//  2. 401 response interceptor: attempts one silent token refresh,
//     retries the original request, then redirects to /login on failure.
//
// WHY IN-MEMORY TOKEN STORAGE (not localStorage)?
// -----------------------------------------------
// localStorage is accessible by any JavaScript running on the page,
// including third-party scripts and XSS payloads. Storing the access
// token in localStorage means a single XSS attack silently exfiltrates
// the token and all the API access it grants — indefinitely, until
// the token expires or is revoked.
//
// In-memory storage (a JS module variable) is only accessible to this
// application's own code. An XSS attacker executing in the same tab
// COULD still call getAccessToken(), but:
//   a) The window of opportunity is the single page session (no persistence).
//   b) HttpOnly cookies for the refresh token would be even safer, but
//      require backend cooperation. For this sprint we store the refresh
//      token in memory too, accepting that trade-off consciously.
//
// The refresh token lives longer and is therefore higher-risk. In a
// production hardening pass, move it to an HttpOnly, Secure, SameSite=Strict
// cookie set by the backend — that way JS cannot access it at all.

import axios from 'axios';
import { refreshAccessToken } from './authApi';

// ------------------------------------------------------------------ //
//  In-memory token store
//  Module-level variables: persist for the lifetime of the page session.
//  Cleared on page reload (intentional — forces re-login on refresh,
//  which is acceptable for a mapping app where sessions are intentional).
// ------------------------------------------------------------------ //
let _accessToken = null;
let _refreshToken = null;
let _tokenExpiration = null;
let _username = null;

export function setTokens({ accessToken, refreshToken, tokenExpiration, username }) {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    _tokenExpiration = tokenExpiration;
    _username = username;
}

export function getAccessToken() { return _accessToken; }
export function getRefreshToken() { return _refreshToken; }
export function getTokenExpiration() { return _tokenExpiration; }
export function getUsername() { return _username; }

export function clearTokens() {
    _accessToken = null;
    _refreshToken = null;
    _tokenExpiration = null;
    _username = null;
}

export function isAuthenticated() {
    return Boolean(_accessToken);
}

// ------------------------------------------------------------------ //
//  Axios instance
// ------------------------------------------------------------------ //
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// REQUEST INTERCEPTOR — attach Bearer token to every outgoing request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Track whether a refresh is already in flight to prevent multiple
// simultaneous refresh calls when several 401s arrive at once.
let isRefreshing = false;
// Queue of resolvers waiting for the new token.
let failedQueue = [];

function processQueue(error, token = null) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
}

// RESPONSE INTERCEPTOR — handle 401s with a single refresh attempt
axiosInstance.interceptors.response.use(
    (response) => response, // pass through successful responses
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and only once per request (_retry flag).
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const storedRefreshToken = getRefreshToken();

            // No refresh token stored → session is dead → go to login
            if (!storedRefreshToken) {
                clearTokens();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Another request is already refreshing.
                // Queue this request to retry once the refresh completes.
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return axiosInstance(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const data = await refreshAccessToken(storedRefreshToken);
                // Persist the new tokens
                setTokens({
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    tokenExpiration: data.tokenExpiration,
                    username: getUsername(), // username does not change on refresh
                });

                // Notify the AuthContext that tokens changed so React state updates.
                // We fire a custom DOM event; AuthContext listens for it.
                window.dispatchEvent(new CustomEvent('tokens-refreshed', { detail: data }));

                processQueue(null, data.accessToken);

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed (token expired or revoked) → force logout
                processQueue(refreshError, null);
                clearTokens();
                window.dispatchEvent(new CustomEvent('session-expired'));
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;