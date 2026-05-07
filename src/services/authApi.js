// authApi.js
// All HTTP calls to the Spring Boot auth endpoints.
// Uses the axios instance (with interceptors) for authenticated calls,
// and plain axios for the public auth endpoints to avoid circular
// dependency with the refresh interceptor.

import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/auth';

// Public axios instance (no interceptors).
// We use this for register/login/refresh/logout to avoid the refresh
// interceptor trying to refresh tokens on these calls themselves.
const publicAxios = axios.create({ baseURL: BASE_URL });

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
    // Returns: JwtResponseDTO { accessToken, refreshToken, tokenType, tokenExpiration }
    const response = await publicAxios.post('/entrar', credentials);
    return response.data;
}

// ------------------------------------------------------------------ //
//  REFRESH
// ------------------------------------------------------------------ //
export async function refreshAccessToken(refreshToken) {
    // Sends: RefreshTokenRequestDTO { refreshToken }
    // Returns: JwtResponseDTO with new accessToken + refreshToken
    const response = await publicAxios.post('/refresh', { refreshToken });
    return response.data;
}

// ------------------------------------------------------------------ //
//  LOGOUT
// ------------------------------------------------------------------ //
export async function logout(refreshToken) {
    // Sends: RefreshTokenRequestDTO { refreshToken }
    // Returns: 200 OK (no body)
    // We use publicAxios here because by the time logout is called, the
    // access token may already be expired or cleared.
    const response = await publicAxios.post('/logout', { refreshToken });
    return response.data;
}

// ------------------------------------------------------------------ //
//  VERIFY EMAIL
// ------------------------------------------------------------------ //
export async function verificarConta(token) {
    const response = await publicAxios.get(`/verificar?token=${encodeURIComponent(token)}`);
    return response.data;
}