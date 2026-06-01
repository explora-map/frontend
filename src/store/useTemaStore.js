import { create } from 'zustand';

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-theme', tema);
  localStorage.setItem('explora-tema', tema);
}

const temaInicial = localStorage.getItem('explora-tema') || 'light';
aplicarTema(temaInicial);

export default create((set) => ({
  tema: temaInicial,
  setTema: (novoTema) => {
    aplicarTema(novoTema);
    set({ tema: novoTema });
  },
  toggleTema: () => {
    set((state) => {
      const novoTema = state.tema === 'light' ? 'dark' : 'light';
      aplicarTema(novoTema);
      return { tema: novoTema };
    });
  },
}));
