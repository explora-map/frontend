// MapaListPage.jsx
// Protected page at /mapas.
// Fetches the authenticated user's maps and displays them as MapaCards.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { obterMeusMaps } from '../services/mapaApi';
import MapaCard from '../components/MapaCard';
import '../assets/styles/mapas.css';

export default function MapaListPage() {
    const { username } = useAuth();
    const navigate = useNavigate();

    const [mapas, setMapas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadMapas = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await obterMeusMaps();
            setMapas(data);
        } catch {
            setError('Non foi posible cargar os teus mapas. Inténtao de novo.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMapas();
    }, [loadMapas]);

    function handleDeleted(id) {
        setMapas((prev) => prev.filter((m) => m.id !== id));
    }

    function handleVisibilityChanged(updated) {
        setMapas((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }

    return (
        <div className="page">
            {/* Topbar */}
            <header className="topbar">
                <div className="topbar__brand">
                    <div className="topbar__brand-dot" />
                    <Link to="/dashboard">Explora Map</Link>
                </div>
                <nav className="topbar__nav">
                    <Link to="/mapas" className="topbar__nav-link topbar__nav-link--active">Os meus mapas</Link>
                    <Link to="/convites" className="topbar__nav-link">Convites</Link>
                </nav>
            </header>

            <main className="page__main">
                <div className="page__header">
                    <h1 className="page__title">Os meus mapas</h1>
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/mapas/novo')}
                    >
                        + Novo mapa
                    </button>
                </div>

                {loading && <p className="state-msg">Cargando mapas…</p>}

                {error && <p className="state-msg state-msg--error">{error}</p>}

                {!loading && !error && mapas.length === 0 && (
                    <div className="empty-state">
                        <p>Aínda non tes mapas.</p>
                        <button
                            className="btn btn--primary"
                            onClick={() => navigate('/mapas/novo')}
                        >
                            Crea o teu primeiro mapa
                        </button>
                    </div>
                )}

                {!loading && mapas.length > 0 && (
                    <div className="mapa-grid">
                        {mapas.map((mapa) => (
                            <MapaCard
                                key={mapa.id}
                                mapa={mapa}
                                currentUsername={username}
                                onDeleted={handleDeleted}
                                onVisibilityChanged={handleVisibilityChanged}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
