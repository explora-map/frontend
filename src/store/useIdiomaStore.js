import { create } from 'zustand';
import i18n from '../i18n';

// Manages language preference and syncs with i18next and backend
export default create((set) => ({
  idioma: localStorage.getItem('explora-idioma') || 'gl',

  setIdioma: async (codigo, actualizarBackend = false, perfilApi = null) => {
    await i18n.changeLanguage(codigo);
    localStorage.setItem('explora-idioma', codigo);
    set({ idioma: codigo });
    if (actualizarBackend && perfilApi) {
      try {
        await perfilApi({ idioma: codigo });
      } catch {
        // Silently fail — localStorage already updated
      }
    }
  },
}));
