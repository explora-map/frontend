import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './assets/styles/global.css';
import './assets/styles/auth.css';
import './assets/styles/confirm-dialog.css';
import './assets/styles/sidebar.css';
import './assets/styles/visualizar-panel.css';
import './assets/styles/notificacions.css';
import './assets/styles/map-search.css';
import './assets/styles/configuracion.css';
import './assets/styles/perfil.css';
import './assets/styles/verificar.css';
import './assets/styles/historial.css';
import './assets/styles/explorar.css';
import './assets/styles/mapa-principal.css';
import './assets/styles/mapas.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="app-loading">Cargando…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
);
