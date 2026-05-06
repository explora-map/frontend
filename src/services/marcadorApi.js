// marcadorApi.js
// All calls to /api/marcadores. Uses axiosInstance (JWT attached automatically).

import axiosInstance from './axiosInstance';

export async function listarMarcadores(mapaId) {
    const res = await axiosInstance.get(`/mapas/${mapaId}/marcadores`);
    return res.data;
}

export async function crearMarcador(mapaId, dto) {
    const res = await axiosInstance.post(`/mapas/${mapaId}/marcadores`, dto);
    return res.data;
}

export async function editarMarcador(id, dto) {
    const res = await axiosInstance.put(`/marcadores/${id}`, dto);
    return res.data;
}

export async function eliminarMarcador(id) {
    await axiosInstance.delete(`/marcadores/${id}`);
}
