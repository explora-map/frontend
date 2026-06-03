// axiosInstance.js
//
// Axios instance pre-configured with:
//  1. Authorization header injection from in-memory token store
//  2. 401 response interceptor: attempts one silent token refresh via the
//     HttpOnly refresh_token cookie, retries the original request, then
//     redirects to /login on failure.
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
// COULD still call getAccessToken(), but the window of opportunity is
// limited to the single page session (no persistence).
//
// The refresh token is stored in an HttpOnly, Secure, SameSite=Strict
// cookie set by the backend — JS cannot access it at all.

import axios from 'axios';
import { refreshAccessToken } from './authApi';

// ------------------------------------------------------------------ //
//  In-memory access token store
//  Module-level variable: persists for the lifetime of the page session.
//  Cleared on page reload — silent recovery via the HttpOnly cookie refresh.
// ------------------------------------------------------------------ //
let _accessToken = null;

export function setTokens(accessToken) {
    _accessToken = accessToken;
}

export function getAccessToken() { return _accessToken; }

export function clearTokens() {
    _accessToken = null;
}

export function isAuthenticated() {
    return Boolean(_accessToken);
}

// ------------------------------------------------------------------ //
//  Axios instance
// ------------------------------------------------------------------ //
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
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
                // The HttpOnly cookie is sent automatically — no body needed.
                const data = await refreshAccessToken();
                setTokens(data.accessToken);

                // Notify AuthContext that tokens changed so React state updates.
                window.dispatchEvent(new CustomEvent('tokens-refreshed', { detail: data }));

                processQueue(null, data.accessToken);

                // Retry the original request with the new token
                originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed (cookie expired or revoked) → force logout
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
