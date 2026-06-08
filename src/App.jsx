// App.jsx
// Router setup. All routes defined here.
// AppLayout provides Sidebar + Notificacions for all routes that need it.
// ProtectedRoute guards authenticated routes using nested <Outlet />.

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import VisualizarMapasPanel from './components/VisualizarMapasPanel';

// Sprint 2 pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
// Sprint 3 pages
import MapaListPage from './pages/MapaListPage';
import MapaCrearPage from './pages/MapaCrearPage';
import MapaDetallePage from './pages/MapaDetallePage';
import MapaEditarPage from './pages/MapaEditarPage';
import ConvitesPage from './pages/ConvitesPage';

// Sprint 5 pages
import MapaPrincipalPage from './pages/MapaPrincipalPage';

// Sprint 6 pages
import ConfiguracionPage from './pages/ConfiguracionPage';
import PerfilPage from './pages/PerfilPage';
import VerificarPage from './pages/VerificarPage';

// Sprint 7 pages
import ExplorarMapasPage from './pages/ExplorarMapasPage';

function PanelController({ onPechar }) {
    const location = useLocation();

    useEffect(() => {
        if (location.pathname !== '/') {
            onPechar();
        }
    }, [location.pathname, onPechar]);

    return null;
}

export default function App() {
    const [panelVisualizar, setPanelVisualizar] = useState(false);

    return (
        <BrowserRouter>
            <AuthProvider>
                <PanelController onPechar={() => setPanelVisualizar(false)} />
                {/* Panel renderizado fóra das rutas para persistir entre navegacións */}
                <VisualizarMapasPanel
                    isOpen={panelVisualizar}
                    onClose={() => setPanelVisualizar(false)}
                />

                <Routes>
                    {/* Rutas públicas sen layout */}
                    <Route path="/login"     element={<LoginPage />} />
                    <Route path="/rexistro"  element={<RegisterPage />} />
                    <Route path="/verificar" element={<VerificarPage />} />

                    {/* Rutas públicas con layout (Sidebar visible sen autenticación) */}
                    <Route element={<AppLayout onVisualizarClick={() => {
                            setPanelVisualizar(prev => !prev);
                            window.dispatchEvent(new CustomEvent('visualizar-toggle'));
                        }} />}>
                        <Route path="/"        element={<MapaPrincipalPage />} />
                        <Route path="/explorar" element={<ExplorarMapasPage />} />
                    </Route>

                    {/* Rutas protexidas con layout */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout onVisualizarClick={() => {
                            setPanelVisualizar(prev => !prev);
                            window.dispatchEvent(new CustomEvent('visualizar-toggle'));
                        }} />}>
                            <Route path="/mapas"            element={<MapaListPage />} />
                            {/* /mapas/novo antes de /mapas/:id para evitar conflito de segmento */}
                            <Route path="/mapas/novo"       element={<MapaCrearPage />} />
                            <Route path="/mapas/:id"        element={<MapaDetallePage />} />
                            <Route path="/mapas/:id/editar" element={<MapaEditarPage />} />
                            <Route path="/convites"         element={<ConvitesPage />} />
                            <Route path="/configuracion"    element={<ConfiguracionPage />} />
                            <Route path="/perfil"           element={<PerfilPage />} />
                        </Route>
                    </Route>

                    {/* Calquera ruta descoñecida vai ao mapa público */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
