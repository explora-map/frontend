// MapaListPage.jsx
// Protected page at /mapas.
// Fetches the authenticated user's maps and displays them as MapaCards.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { obterMeusMaps } from '../services/mapaApi';
import MapaCard from '../components/MapaCard';
import textos from '../constants/textos';
import '../assets/styles/mapas.css';

export default function MapaListPage() {
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
            setError(textos.mapas.errorCargar);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMapas();
    }, [loadMapas]);

    function handleEliminar(mapaId) {
        setMapas((prev) => prev.filter((m) => m.id !== mapaId));
    }

    function handleVisibilidadeCambiada(mapaActualizado) {
        setMapas((prev) => prev.map((m) => (m.id === mapaActualizado.id ? mapaActualizado : m)));
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
                    <Link to="/mapas" className="topbar__nav-link topbar__nav-link--active">{textos.nav.osMenusMapas}</Link>
                    <Link to="/convites" className="topbar__nav-link">{textos.nav.convites}</Link>
                </nav>
            </header>

            <main className="page__main">
                <div className="page__header">
                    <h1 className="page__title">{textos.mapas.titulo}</h1>
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate('/mapas/novo')}
                    >
                        {textos.mapas.botonNovo}
                    </button>
                </div>

                {loading && <p className="state-msg">{textos.cargando.mapas}</p>}

                {error && <p className="state-msg state-msg--error">{error}</p>}

                {!loading && !error && mapas.length === 0 && (
                    <div className="empty-state">
                        <p>{textos.mapas.sinMapasSimple}</p>
                        <button
                            className="btn btn--primary"
                            onClick={() => navigate('/mapas/novo')}
                        >
                            {textos.mapas.crearPrimeiro}
                        </button>
                    </div>
                )}

                {!loading && mapas.length > 0 && (
                    <div className="mapa-grid">
                        {mapas.map((mapa) => (
                            <MapaCard
                                key={mapa.id}
                                mapa={mapa}
                                onEliminar={handleEliminar}
                                onVisibilidadeCambiada={handleVisibilidadeCambiada}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
