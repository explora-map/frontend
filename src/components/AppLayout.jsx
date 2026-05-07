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

export default function AppLayout({ onVisualizarClick }) {
    const { expanded } = useSidebarStore();
    const { isAuthenticated } = useAuth();

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
            {isAuthenticated && (
                <div className="mapa-principal__topbar">
                    <Notificacions />
                </div>
            )}
        </div>
    );
}
