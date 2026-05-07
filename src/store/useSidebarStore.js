// useSidebarStore.js
// Garda o estado colapsado/expandido do panel lateral.
// Persiste en sessionStorage para sobrevivir a navegacións dentro da sesión
// pero non entre pestanas nin tras pechar o navegador.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useSidebarStore = create(
    persist(
        (set) => ({
            expanded: true,

            toggleSidebar: () => set((state) => ({ expanded: !state.expanded })),

            setSidebar: (value) => set({ expanded: value }),
        }),
        {
            name: 'explora-sidebar',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
);

export default useSidebarStore;
