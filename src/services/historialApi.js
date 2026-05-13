import axiosInstance from './axiosInstance';

export async function obterHistorial(mapaId) {
    const res = await axiosInstance.get(`/mapas/${mapaId}/historial`);
    return res.data;
}

export async function obterHistorialPorTipo(mapaId, tipo) {
    const res = await axiosInstance.get(`/mapas/${mapaId}/historial`, { params: { tipo } });
    return res.data;
}

export async function obterHistorialPorUsuaria(mapaId, usuaria) {
    const res = await axiosInstance.get(`/mapas/${mapaId}/historial`, { params: { usuaria } });
    return res.data;
}
