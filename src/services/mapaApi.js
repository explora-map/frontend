// mapaApi.js
// All calls to /api/mapas. Uses axiosInstance (JWT attached automatically).

import axiosInstance from './axiosInstance';

export async function crearMapa(data) {
    const res = await axiosInstance.post('/mapas/novo', data);
    return res.data;
}

export async function obterMeusMaps() {
    const res = await axiosInstance.get('/mapas/meus');
    return res.data;
}

export async function obterMapaPorId(id) {
    const res = await axiosInstance.get(`/mapas/${id}`);
    return res.data;
}

export async function editarMapa(id, data) {
    const res = await axiosInstance.put(`/mapas/editar/${id}`, data);
    return res.data;
}

export async function eliminarMapa(id) {
    await axiosInstance.delete(`/mapas/eliminar/${id}`);
}

export async function cambiarVisibilidade(id, tipo) {
    const res = await axiosInstance.patch(`/mapas/${id}/visibilidade`, { tipo });
    return res.data;
}

export async function obterMapasPublicos(latitude, lonxitude, radio) {
    const res = await axiosInstance.get('/mapas/publicos', {
        params: { latitude, lonxitude, radio },
    });
    return res.data;
}
