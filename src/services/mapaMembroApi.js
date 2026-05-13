import axiosInstance from './axiosInstance';

export async function listarMembros(mapaId) {
    const response = await axiosInstance.get(`/mapas/${mapaId}/membros`);
    return response.data;
}

export async function cambiarRol(mapaId, username, rol) {
    const response = await axiosInstance.patch(`/mapas/${mapaId}/membros/${username}/rol`, { rol });
    return response.data;
}

export async function eliminarMembro(mapaId, username) {
    await axiosInstance.delete(`/mapas/${mapaId}/membros/${username}`);
}
