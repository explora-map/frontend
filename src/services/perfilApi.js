import axiosInstance from './axiosInstance';

export async function obterPerfil() {
  const response = await axiosInstance.get('/perfil');
  return response.data;
}

export async function actualizarPerfil(data) {
  const payload = {};
  if (data.nome?.trim()) payload.nome = data.nome.trim();
  if (data.username?.trim()) payload.username = data.username.trim();
  if (data.correo?.trim()) payload.correo = data.correo.trim();
  payload.contrasinelActual = data.contrasinelActual || undefined;
  payload.contrasinelNovo = data.contrasinelNovo || undefined;
  payload.contrasinelNovoConfirmacion = data.contrasinelNovoConfirmacion || undefined;
  const response = await axiosInstance.patch('/perfil', payload);
  return response.data;
}

export async function eliminarConta() {
  const response = await axiosInstance.delete('/perfil');
  return response.data;
}
