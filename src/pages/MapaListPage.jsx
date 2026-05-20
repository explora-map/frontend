// MapaListPage.jsx
// Protected page at /mapas.
// Three tabs: maps created by the user, maps they collaborate on, and saved maps.
// Each tab loads lazily on first activation.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { obterMeusMaps, obterMapasColaboradora, obterMapasGardados } from '../services/mapaApi';
import { desgardarMapa } from '../services/mapaGardadoApi';
import MapaCard from '../components/MapaCard';
import '../assets/styles/mapas.css';

export default function MapaListPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const LAPELAS = [
        { id: 'creados',       label: t('mapas.lapela.creados') },
        { id: 'colaboracións', label: t('mapas.lapela.colaboracions') },
        { id: 'gardados',      label: t('mapas.lapela.gardados') },
    ];

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
            setErrorCreados(t('mapas.erroCargarColaboracions'));
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
            setErrorColab(t('mapas.erroCargarColaboracions'));
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
            setErrorGardados(t('mapas.erroCargarGardados'));
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
            setErrorGardados(t('mapas.erroDesgardar'));
        }
    }

    return (
        <div className="page">
            <main className="page__main">
                <div className="page__header">
                    <h1 className="page__title">{t('mapas.lapela.creados')}</h1>
                    {lapela === 'creados' && (
                        <button className="btn btn--primary" onClick={() => navigate('/mapas/novo')}>
                            {t('mapas.crearMapa')}
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
                        {loadingCreados && <p className="state-msg">{t('mapas.cargando')}</p>}
                        {errorCreados && (
                            <p className="state-msg state-msg--error" role="alert">{errorCreados}</p>
                        )}
                        {!loadingCreados && !errorCreados && mapasCreados.length === 0 && (
                            <div className="empty-state">
                                <p>{t('mapas.baleiro.creados')}</p>
                                <button className="btn btn--primary" onClick={() => navigate('/mapas/novo')}>
                                    {t('mapas.baleiro.creados')}
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
                                        rolEfectivo="PROPIETARIA"
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {lapela === 'colaboracións' && (
                    <>
                        {loadingColab && <p className="state-msg">{t('mapas.cargando')}</p>}
                        {errorColab && (
                            <p className="state-msg state-msg--error" role="alert">{errorColab}</p>
                        )}
                        {!loadingColab && !errorColab && mapasColab.length === 0 && (
                            <p className="state-msg">{t('mapas.baleiro.colaboracions')}</p>
                        )}
                        {!loadingColab && mapasColab.length > 0 && (
                            <div className="mapa-grid">
                                {mapasColab.map((mapa) => (
                                    <MapaCard
                                        key={mapa.id}
                                        mapa={mapa}
                                        rolEfectivo={mapa.rol || 'COLABORADORA'}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {lapela === 'gardados' && (
                    <>
                        {loadingGardados && <p className="state-msg">{t('mapas.cargando')}</p>}
                        {errorGardados && (
                            <p className="state-msg state-msg--error" role="alert">{errorGardados}</p>
                        )}
                        {!loadingGardados && !errorGardados && mapasGardados.length === 0 && (
                            <p className="state-msg">{t('mapas.baleiro.gardados')}</p>
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
                                                {t('mapas.botonDesgardar')}
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
