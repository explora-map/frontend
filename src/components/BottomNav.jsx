// BottomNav.jsx
// Navegación inferior para pantallas móbil (<= 640 px).
// Complementa o Sidebar que se oculta en mobile.

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

/* ---- Iconas SVG inline ---- */

const GlobeIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const LoginIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const LayersIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

const PinIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const CompassIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

const UserIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={22} height={22}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

/* ---- Compoñente principal ---- */

export default function BottomNav({ onVisualizarClick }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    function isActive(ruta) {
        return location.pathname === ruta;
    }

    const soNaInicio = location.pathname === '/';

    const itemsNoAuth = [
        { ruta: '/',         label: t('nav.explorar'),        icona: <GlobeIcon /> },
        { ruta: '/explorar', label: t('nav.explorarMapas'),   icona: <CompassIcon /> },
        ...(soNaInicio && onVisualizarClick ? [{ ruta: '/mapas-visualizar', label: t('nav.visualizarMapas'), icona: <LayersIcon /> }] : []),
        { ruta: '/login',    label: t('nav.iniciarSesion'),   icona: <LoginIcon /> },
    ];

    const itemsAuth = [
        { ruta: '/',         label: t('nav.explorar'),        icona: <GlobeIcon /> },
        { ruta: '/explorar', label: t('nav.explorarMapas'),   icona: <CompassIcon /> },
        ...(soNaInicio && onVisualizarClick ? [{ ruta: '/mapas-visualizar', label: t('nav.visualizarMapas'), icona: <LayersIcon /> }] : []),
        { ruta: '/mapas',    label: t('nav.osMenusMapas'),    icona: <PinIcon /> },
        { ruta: '/perfil',   label: t('nav.perfil'),          icona: <UserIcon /> },
    ];

    const items = isAuthenticated ? itemsAuth : itemsNoAuth;

    return (
        <nav className="bottom-nav" aria-label="Navegación principal">
            <ul className="bottom-nav__list">
                {items.map(({ ruta, label, icona }) => (
                    <li key={ruta} className="bottom-nav__item">
                        <button
                            className={`bottom-nav__btn ${isActive(ruta) ? 'bottom-nav__btn--active' : ''}`}
                            onClick={() => ruta === '/mapas-visualizar' ? onVisualizarClick() : navigate(ruta)}
                            aria-label={label}
                        >
                            <span className="bottom-nav__icon" aria-hidden="true">
                                {icona}
                            </span>
                            <span className="bottom-nav__label">{label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
