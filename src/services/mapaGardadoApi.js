import axiosInstance from './axiosInstance';

export async function gardarMapa(mapaId) {
    const res = await axiosInstance.post(`/mapas/${mapaId}/gardar`);
    return res.data;
}

export async function desgardarMapa(mapaId) {
    await axiosInstance.delete(`/mapas/${mapaId}/gardar`);
}
