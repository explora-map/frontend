// AppLayout.jsx
// Layout compartido para todas as rutas con navegación lateral.
// Renderiza Sidebar, BottomNav, campá de notificacións e o contido da ruta filla.

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import Notificacions from './Notificacions';
import useSidebarStore from '../store/useSidebarStore';
import { useAuth } from '../hooks/useAuth';
import useTemaStore from '../store/useTemaStore';
import { MoonIcon, SunIcon } from './Iconas';

export default function AppLayout({ onVisualizarClick }) {
    const { expanded } = useSidebarStore();
    const { isAuthenticated } = useAuth();
    const { tema, toggleTema } = useTemaStore();

    return (
        <div className="app-layout">
            <MobileHeader />
            <Sidebar onVisualizarClick={onVisualizarClick} />
            <BottomNav onVisualizarClick={onVisualizarClick} />
            <main
                className="app-layout__main"
                style={{
                    marginLeft: `var(${expanded ? '--sidebar-expanded-width' : '--sidebar-collapsed-width'})`,
                    transition: `margin-left var(--duration-slow) var(--ease-default)`,
                }}
            >
                <Outlet />
            </main>
            <div className="mapa-principal__topbar mapa-principal__topbar--desktop">
                <button
                    className="topbar-tema-btn"
                    onClick={toggleTema}
                    aria-label={tema === 'light' ? 'Activar modo escuro' : 'Activar modo claro'}
                    title={tema === 'light' ? 'Modo escuro' : 'Modo claro'}
                >
                    {tema === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
                </button>
                {isAuthenticated && <Notificacions />}
            </div>
        </div>
    );
}
