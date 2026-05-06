// categoriaApi.js
// All calls to /api/categorias. Uses axiosInstance (JWT attached automatically).

import axiosInstance from './axiosInstance';

export async function listarCategorias(mapaId) {
    const res = await axiosInstance.get(`/mapas/${mapaId}/categorias`);
    return res.data;
}

export async function crearCategoria(mapaId, dto) {
    const res = await axiosInstance.post(`/mapas/${mapaId}/categorias`, dto);
    return res.data;
}

export async function editarCategoria(id, dto) {
    const res = await axiosInstance.put(`/categorias/${id}`, dto);
    return res.data;
}

export async function eliminarCategoria(id) {
    await axiosInstance.delete(`/categorias/${id}`);
}
