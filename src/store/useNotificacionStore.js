// useNotificacionStore.js
// Xestiona as notificacións da usuaria (convites recibidos, cambios en mapas…).
// Estado en memoria: resétase ao recargar a páxina.

import { create } from 'zustand';

export const TIPO_NOTIFICACION = {
    CONVITE_RECIBIDO: 'CONVITE_RECIBIDO',
    CAMBIO_MAPA:      'CAMBIO_MAPA',
};

const useNotificacionStore = create((set, get) => ({
    notificacions: [],
    cargando: false,
    erro: null,

    setNotificacions: (lista) => set({ notificacions: lista }),

    marcarLida: (id) => set((state) => ({
        notificacions: state.notificacions.map((n) =>
            n.id === id ? { ...n, lida: true } : n,
        ),
    })),

    marcarTodasLidas: () => set((state) => ({
        notificacions: state.notificacions.map((n) => ({ ...n, lida: true })),
    })),

    eliminarNotificacion: (id) => set((state) => ({
        notificacions: state.notificacions.filter((n) => n.id !== id),
    })),

    totalNonLidas: () => get().notificacions.filter((n) => !n.lida).length,
}));

export default useNotificacionStore;
