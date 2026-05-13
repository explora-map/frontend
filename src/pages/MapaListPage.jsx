// MapaListPage.jsx
// Protected page at /mapas.
// Three tabs: maps created by the user, maps they collaborate on, and saved maps.
// Each tab loads lazily on first activation.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { obterMeusMaps, obterMapasColaboradora, obterMapasGardados } from '../services/mapaApi';
import { desgardarMapa } from '../services/mapaGardadoApi';
import MapaCard from '../components/MapaCard';
import textos from '../constants/textos';
import '../assets/styles/mapas.css';

const LAPELAS = [
    { id: 'creados',       label: 'Os meus mapas' },
    { id: 'colaboracións', label: 'Colaboracións' },
    { id: 'gardados',      label: 'Gardados' },
];

export default function MapaListPage() {
    const navigate = useNavigate();

    const [lapela, setLapela] = useState('creados');
    const cargadas = useRef(new Set());

    const [mapasCreados,    setMapasCreados]    = useState([]);
    const [loadingCreados,  setLoadingCreados]  = useState(false);
    const [errorCreados,    setErrorCreados]    = useState('');

    const [mapasColab,    setMapasColab]    = useState([]);
    const [loadingColab,  setLoadingColab]  = useState(false);
    const [errorColab,    setErrorColab]    = useState('');

    const [mapasGardados,    setMapasGardados]    = useState([]);
    const [loadingGardados,  setLoadingGardados]  = useState(false);
    const [errorGardados,    setErrorGardados]    = useState('');

    const cargarCreados = useCallback(async () => {
        setLoadingCreados(true);
        setErrorCreados('');
        try {
            const data = await obterMeusMaps();
            setMapasCreados(data);
        } catch {
            setErrorCreados(textos.mapas.errorCargar);
        } finally {
            setLoadingCreados(false);
        }
    }, []);

    const cargarColab = useCallback(async () => {
        setLoadingColab(true);
        setErrorColab('');
        try {
            const data = await obterMapasColaboradora();
            setMapasColab(data);
        } catch {
            setErrorColab('Non foi posible cargar os mapas de colaboración.');
        } finally {
            setLoadingColab(false);
        }
    }, []);

    const cargarGardados = useCallback(async () => {
        setLoadingGardados(true);
        setErrorGardados('');
        try {
            const data = await obterMapasGardados();
            setMapasGardados(data);
        } catch {
            setErrorGardados('Non foi posible cargar os mapas gardados.');
        } finally {
            setLoadingGardados(false);
        }
    }, []);

    useEffect(() => {
        if (!cargadas.current.has(lapela)) {
            cargadas.current.add(lapela);
            if (lapela === 'creados')       cargarCreados();
            else if (lapela === 'colaboracións') cargarColab();
            else if (lapela === 'gardados') cargarGardados();
        }
    }, [lapela, cargarCreados, cargarColab, cargarGardados]);

    function handleEliminar(mapaId) {
        setMapasCreados((prev) => prev.filter((m) => m.id !== mapaId));
    }

    function handleVisibilidadeCambiada(mapaActualizado) {
        setMapasCreados((prev) => prev.map((m) => (m.id === mapaActualizado.id ? mapaActualizado : m)));
    }

    async function handleDesgardar(mapaId) {
        try {
            await desgardarMapa(mapaId);
            setMapasGardados((prev) => prev.filter((m) => m.id !== mapaId));
        } catch {
            setErrorGardados('Non foi posible desgardar o mapa. Tenta de novo.');
        }
    }

    return (
        <div className="page">
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
                    {lapela === 'creados' && (
                        <button className="btn btn--primary" onClick={() => navigate('/mapas/novo')}>
                            {textos.mapas.botonNovo}
                        </button>
                    )}
                </div>

                <div className="tabs" role="tablist">
                    {LAPELAS.map(({ id, label }) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={lapela === id}
                            className={`tab${lapela === id ? ' tab--active' : ''}`}
                            onClick={() => setLapela(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {lapela === 'creados' && (
                    <>
                        {loadingCreados && <p className="state-msg">Cargando...</p>}
                        {errorCreados && (
                            <p className="state-msg state-msg--error" role="alert">{errorCreados}</p>
                        )}
                        {!loadingCreados && !errorCreados && mapasCreados.length === 0 && (
                            <div className="empty-state">
                                <p>Aínda non creaches ningún mapa.</p>
                                <button className="btn btn--primary" onClick={() => navigate('/mapas/novo')}>
                                    {textos.mapas.crearPrimeiro}
                                </button>
                            </div>
                        )}
                        {!loadingCreados && mapasCreados.length > 0 && (
                            <div className="mapa-grid">
                                {mapasCreados.map((mapa) => (
                                    <MapaCard
                                        key={mapa.id}
                                        mapa={mapa}
                                        onEliminar={handleEliminar}
                                        onVisibilidadeCambiada={handleVisibilidadeCambiada}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {lapela === 'colaboracións' && (
                    <>
                        {loadingColab && <p className="state-msg">Cargando...</p>}
                        {errorColab && (
                            <p className="state-msg state-msg--error" role="alert">{errorColab}</p>
                        )}
                        {!loadingColab && !errorColab && mapasColab.length === 0 && (
                            <p className="state-msg">Aínda non colaboras en ningún mapa.</p>
                        )}
                        {!loadingColab && mapasColab.length > 0 && (
                            <div className="mapa-grid">
                                {mapasColab.map((mapa) => (
                                    <MapaCard key={mapa.id} mapa={mapa} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {lapela === 'gardados' && (
                    <>
                        {loadingGardados && <p className="state-msg">Cargando...</p>}
                        {errorGardados && (
                            <p className="state-msg state-msg--error" role="alert">{errorGardados}</p>
                        )}
                        {!loadingGardados && !errorGardados && mapasGardados.length === 0 && (
                            <p className="state-msg">Aínda non gardaches ningún mapa.</p>
                        )}
                        {!loadingGardados && mapasGardados.length > 0 && (
                            <div className="mapa-grid">
                                {mapasGardados.map((mapa) => (
                                    <MapaCard
                                        key={mapa.id}
                                        mapa={mapa}
                                        accionExtra={
                                            <button
                                                className="btn btn--ghost btn--sm"
                                                onClick={(e) => { e.stopPropagation(); handleDesgardar(mapa.id); }}
                                            >
                                                Desgardar
                                            </button>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
