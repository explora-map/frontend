// authApi.js
// All HTTP calls to the Spring Boot auth endpoints.
// Uses the axios instance (with interceptors) for authenticated calls,
// and plain axios for the public auth endpoints to avoid circular
// dependency with the refresh interceptor.

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_AUTH_URL;

// Public axios instance (no interceptors).
// withCredentials: true is required so the browser sends and receives
// the HttpOnly refresh_token cookie on cross-origin requests.
// We use this for register/login/refresh/logout to avoid the refresh
// interceptor trying to refresh tokens on these calls themselves.
const publicAxios = axios.create({ baseURL: BASE_URL, withCredentials: true });

// ------------------------------------------------------------------ //
//  REGISTER
// ------------------------------------------------------------------ //
export async function register(data) {
    // data: { nome, username, correo, password }
    const response = await publicAxios.post('/rexistro', data);
    return response.data; // 200 OK — no body expected
}

// ------------------------------------------------------------------ //
//  LOGIN
// ------------------------------------------------------------------ //
export async function login(credentials) {
    // credentials: { username, password }
    // Returns: JwtResponseDTO { accessToken, tokenType, tokenExpiration }
    // The refresh token is set as an HttpOnly cookie by the server.
    const response = await publicAxios.post('/entrar', credentials);
    return response.data;
}

// ------------------------------------------------------------------ //
//  REFRESH
// ------------------------------------------------------------------ //
export async function refreshAccessToken() {
    // The refresh_token HttpOnly cookie is sent automatically by the browser.
    // Returns: JwtResponseDTO with new accessToken
    const response = await publicAxios.post('/renovar');
    return response.data;
}

// ------------------------------------------------------------------ //
//  LOGOUT
// ------------------------------------------------------------------ //
export async function logout() {
    // The refresh_token HttpOnly cookie is sent automatically by the browser.
    // The server invalidates the cookie and the stored token.
    // Returns: 200 OK (no body)
    const response = await publicAxios.post('/pechar');
    return response.data;
}

// ------------------------------------------------------------------ //
//  VERIFY EMAIL
// ------------------------------------------------------------------ //
export async function verificarConta(token) {
    const response = await publicAxios.get(`/verificar?token=${encodeURIComponent(token)}`);
    return response.data;
}
