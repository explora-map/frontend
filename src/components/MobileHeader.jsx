// MobileHeader.jsx
// Cabeceira fixa para pantallas móbil (<= 640 px).
// Mostra o logotipo da aplicación e permite navegar á páxina principal.

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MobileHeader() {
    const navigate = useNavigate();

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
        </header>
    );
}
