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

export default function AppLayout({ onVisualizarClick }) {
    const { expanded } = useSidebarStore();
    const { isAuthenticated } = useAuth();
    const { tema, toggleTema } = useTemaStore();

    return (
        <div className="app-layout">
            <MobileHeader />
            <Sidebar onVisualizarClick={onVisualizarClick} />
            <BottomNav />
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
                    {tema === 'light' ? (
                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/>
                            <line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                    )}
                </button>
                {isAuthenticated && <Notificacions />}
            </div>
        </div>
    );
}
