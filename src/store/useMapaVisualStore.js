// useMapaVisualStore.js
// Controla que mapas e categorías están visualmente activos no explorador.
// Tamén almacena os marcadores e categorías cargados para cada mapa.
// Estado en memoria: resétase ao recargar a páxina.
// Regra: ao desactivar un mapa, todas as categorías presentes no store desactívanse.

import { create } from 'zustand';

const initialState = {
    mapasActivos:      {},  // { [mapaId]: boolean }
    categoriasActivas: {},  // { [categoriaId]: boolean }
    marcadoresPorMapa: {},  // { [mapaId]: marcador[] }
    categoriasPorMapa: {},  // { [mapaId]: categoria[] }
};

const useMapaVisualStore = create((set, get) => ({
    ...initialState,

    toggleMapa: (mapaId) => set((state) => {
        const novoValor = !state.mapasActivos[mapaId];
        const categoriasActivas = novoValor
            ? state.categoriasActivas
            : Object.fromEntries(
                Object.keys(state.categoriasActivas).map((k) => [k, false]),
              );
        return {
            mapasActivos: { ...state.mapasActivos, [mapaId]: novoValor },
            categoriasActivas,
        };
    }),

    toggleCategoria: (categoriaId) => set((state) => ({
        categoriasActivas: {
            ...state.categoriasActivas,
            [categoriaId]: !state.categoriasActivas[categoriaId],
        },
    })),

    activarTodasCategorias: (categoriaIds) => set((state) => ({
        categoriasActivas: {
            ...state.categoriasActivas,
            ...Object.fromEntries(categoriaIds.map((id) => [id, true])),
        },
    })),

    desactivarTodasCategorias: (categoriaIds) => set((state) => ({
        categoriasActivas: {
            ...state.categoriasActivas,
            ...Object.fromEntries(categoriaIds.map((id) => [id, false])),
        },
    })),

    setMarcadoresMapa: (mapaId, marcadores) => set((state) => ({
        marcadoresPorMapa: { ...state.marcadoresPorMapa, [mapaId]: marcadores },
    })),

    setCategoriasMapa: (mapaId, categorias) => set((state) => ({
        categoriasPorMapa: { ...state.categoriasPorMapa, [mapaId]: categorias },
    })),

    isMapaActivo:      (mapaId)      => Boolean(get().mapasActivos[mapaId]),
    isCategoriaActiva: (categoriaId) => Boolean(get().categoriasActivas[categoriaId]),

    resetar: () => set(initialState),
}));

export default useMapaVisualStore;
