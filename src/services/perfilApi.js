import axiosInstance from './axiosInstance';

export async function obterPerfil() {
  const response = await axiosInstance.get('/perfil');
  return response.data;
}

export async function actualizarPerfil(datos) {
  const response = await axiosInstance.patch('/perfil', datos);
  return response.data;
}

export async function eliminarConta() {
  const response = await axiosInstance.delete('/perfil');
  return response.data;
}
