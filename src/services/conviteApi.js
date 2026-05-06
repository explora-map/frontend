// conviteApi.js
// All calls to /api/convites. Uses axiosInstance (JWT attached automatically).

import axiosInstance from './axiosInstance';

export async function enviarConvite(mapaId, usernameConvidada) {
    const res = await axiosInstance.post('/convites/novo', { mapaId, usernameConvidada });
    return res.data;
}

export async function obterConvitesEnviados() {
    const res = await axiosInstance.get('/convites');
    return res.data;
}

export async function obterConvitesRecibidos() {
    const res = await axiosInstance.get('/convites/recibidos');
    return res.data;
}

export async function aceptarConvite(token) {
    await axiosInstance.patch(`/convites/${token}/aceptar`);
}

export async function rexeitarConvite(token) {
    await axiosInstance.patch(`/convites/${token}/rexeitar`);
}

export async function cancelarConvite(token) {
    await axiosInstance.delete(`/convites/${token}`);
}
