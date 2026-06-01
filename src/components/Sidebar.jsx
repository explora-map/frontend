// Sidebar.jsx
// Panel lateral fixo con navegación principal.
// Expandible/colapsable. Adapta os items segundo o estado de autenticación.
// O item "Visualizar mapas" abre un panel drawer en vez de navegar.

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import useSidebarStore from '../store/useSidebarStore';
import useIdiomaStore from '../store/useIdiomaStore';

/* ---- Iconas SVG inline (Feather-style, 24×24) ---- */

const ChevronIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={16} height={16}>
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const GlobeIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const LoginIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const LayersIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

const PinIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
);

const CompassIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={20} height={20}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

/* ---- Compoñente principal ---- */

export default function Sidebar({ onVisualizarClick }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, username, logout } = useAuth();
    const expanded      = useSidebarStore((state) => state.expanded);
    const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

    const soNaInicio = location.pathname === '/';
    const { idioma, setIdioma } = useIdiomaStore();

    function isActive(ruta) {
        return location.pathname === ruta;
    }

    function handleItemClick(ruta) {
        if (ruta === '/mapas-visualizar' && onVisualizarClick) {
            onVisualizarClick();
        } else {
            navigate(ruta);
        }
    }

    const itemsNoAuth = [
        { ruta: '/login',    label: t('nav.iniciarSesion'), icona: <LoginIcon /> },
        { ruta: '/',         label: t('nav.explorar'),      icona: <GlobeIcon /> },
        { ruta: '/explorar', label: t('nav.explorarMapas'), icona: <CompassIcon /> },
    ];

    const itemsAuth = [
        { ruta: '/',                 label: t('nav.explorar'),        icona: <GlobeIcon /> },
        { ruta: '/explorar',         label: t('nav.explorarMapas'),   icona: <CompassIcon /> },
        { ruta: '/mapas-visualizar', label: t('nav.visualizarMapas'), icona: <LayersIcon /> },
        { ruta: '/mapas',            label: t('nav.osMenusMapas'),    icona: <PinIcon /> },
        { ruta: '/convites',         label: t('nav.convites'),        icona: <BellIcon /> },
        { ruta: '/configuracion',    label: t('nav.configuracion'),   icona: <SettingsIcon /> },
    ];

    const items = isAuthenticated ? itemsAuth : itemsNoAuth;

    return (
        <aside
            className={`sidebar ${expanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}
            aria-label="Navegación principal"
        >
            <Link
                to="/"
                className="sidebar__logo"
                aria-label="Ir á páxina principal"
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
                <div className="sidebar__logo-icona" aria-hidden="true">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="10" r="3" fill="var(--color-primary-500)" />
                        <path
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                            fill="var(--color-primary-100)"
                            stroke="var(--color-primary-500)"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                {expanded && (
                    <span className="sidebar__logo-texto" aria-hidden="true">Explora</span>
                )}
            </Link>
            <div className="sidebar__logo-separador" aria-hidden="true" />

            <button
                className="sidebar__toggle"
                onClick={toggleSidebar}
                aria-label={expanded ? 'Colapsar menú' : 'Expandir menú'}
            >
                <ChevronIcon />
            </button>

            <nav className="sidebar__nav">
                <ul className="sidebar__list">
                    {isAuthenticated && (
                        <li className="sidebar__item sidebar__item--avatar">
                            <Link
                                to="/perfil"
                                className="sidebar__link"
                                aria-label="Ir ao perfil"
                                style={{ textDecoration: 'none', cursor: 'pointer' }}
                            >
                                <span className="sidebar__avatar" aria-hidden="true" title={username}>
                                    {username?.[0]?.toUpperCase()}
                                </span>
                                {expanded && (
                                    <span className="sidebar__label sidebar__label--username">
                                        {username}
                                    </span>
                                )}
                            </Link>
                        </li>
                    )}

                    {items.map(({ ruta, label, icona }) => {
                        if (ruta === '/mapas-visualizar') {
                            if (!soNaInicio) return null;
                            return (
                                <li key={ruta} className="sidebar__item">
                                    <button
                                        className={`sidebar__link ${isActive(ruta) ? 'sidebar__link--active' : ''}`}
                                        onClick={() => onVisualizarClick ? onVisualizarClick() : null}
                                        title={!expanded ? label : undefined}
                                        aria-label={label}
                                    >
                                        <span className="sidebar__icon" aria-hidden="true">
                                            {icona}
                                        </span>
                                        {expanded && (
                                            <span className="sidebar__label">{label}</span>
                                        )}
                                    </button>
                                </li>
                            );
                        }
                        return (
                            <li key={ruta} className="sidebar__item">
                                <button
                                    className={`sidebar__link ${isActive(ruta) ? 'sidebar__link--active' : ''}`}
                                    onClick={() => handleItemClick(ruta)}
                                    title={!expanded ? label : undefined}
                                    aria-label={label}
                                >
                                    <span className="sidebar__icon" aria-hidden="true">
                                        {icona}
                                    </span>
                                    {expanded && (
                                        <span className="sidebar__label">{label}</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}

                    <li className="sidebar__item sidebar__item--idioma">
                        <div className="sidebar__idioma">
                            <button
                                className={`sidebar__idioma-btn${idioma === 'gl' ? ' sidebar__idioma-btn--activo' : ''}`}
                                onClick={() => setIdioma('gl', false)}
                                aria-pressed={idioma === 'gl'}
                                title="Galego"
                            >
                                GL
                            </button>
                            <button
                                className={`sidebar__idioma-btn${idioma === 'en' ? ' sidebar__idioma-btn--activo' : ''}`}
                                onClick={() => setIdioma('en', false)}
                                aria-pressed={idioma === 'en'}
                                title="English"
                            >
                                EN
                            </button>
                        </div>
                    </li>

                    {isAuthenticated && (
                        <li className="sidebar__item sidebar__item--logout">
                            <button
                                className="sidebar__link sidebar__link--logout"
                                onClick={logout}
                                aria-label={t('nav.pecharSesion')}
                            >
                                <span className="sidebar__icon" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                         viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                        <polyline points="16 17 21 12 16 7"/>
                                        <line x1="21" y1="12" x2="9" y2="12"/>
                                    </svg>
                                </span>
                                {expanded && (
                                    <span className="sidebar__label">{t('nav.pecharSesion')}</span>
                                )}
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
        </aside>
    );
}
