// MobileHeader.jsx
// Cabeceira fixa para pantallas móbil (<= 640 px).
// Mostra o logotipo da aplicación e permite navegar á páxina principal.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import useTemaStore from '../store/useTemaStore';
import { useAuth } from '../hooks/useAuth';
import Notificacions from './Notificacions';

export default function MobileHeader() {
    const navigate = useNavigate();
    const { tema, toggleTema } = useTemaStore();
    const { isAuthenticated } = useAuth();

    return (
        <header className="mobile-header">
            <div
                className="mobile-header__logo"
                onClick={() => navigate('/')}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate('/')}
                aria-label="Explora — ir á páxina principal"
            >
                <svg
                    width="22"
                    height="22"
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
                <span className="mobile-header__texto">Explora</span>
            </div>
            <div className="mobile-header__accions">
                <button
                    className="topbar-tema-btn"
                    onClick={toggleTema}
                    aria-label={tema === 'light' ? 'Activar modo escuro' : 'Activar modo claro'}
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
        </header>
    );
}
