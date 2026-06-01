import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { gardarMapa, desgardarMapa, obterMapasGardados } from '../services/mapaGardadoApi';
import { BookmarkIcon, BookmarkFilledIcon, EyeIcon } from '../components/Iconas';
import { useAuth } from '../hooks/useAuth';
import useMapaVisualStore from '../store/useMapaVisualStore';

const LAT_GALICIA = 42.8782;
const LON_GALICIA = -8.5448;
const RADIUS_DESTACADOS = 50000;
const RADIUS_BUSCA = 50000;

export default function ExplorarMapasPage() {
    const navigate = useNavigate();
    const { isAuthenticated, username } = useAuth();
    const { toggleMapa, isMapaActivo } = useMapaVisualStore();

    const [inputBusca, setInputBusca] = useState('');
    const [mapasGardadosIds, setMapasGardadosIds] = useState(new Set());
    const [buscaActiva, setBuscaActiva] = useState('');
    const [mapas, setMapas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [erroNominatim, setErroNominatim] = useState(false);

    const cargarMapas = useCallback(async (lat, lon, radius) => {
        if (!isAuthenticated) return;
        setCargando(true);
        setErroNominatim(false);
        try {
            const res = await axiosInstance.get(
                `/mapas/publicos?lat=${lat}&lon=${lon}&radius=${radius}`
            );
            setMapas(res.data);
        } catch (err) {
            console.log('Erro ao cargar mapas:', err.response?.status, err.response?.data);
            setMapas([]);
        } finally {
            setCargando(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        cargarMapas(LAT_GALICIA, LON_GALICIA, RADIUS_DESTACADOS);
    }, [cargarMapas]);

    useEffect(() => {
        if (!isAuthenticated) return;
        obterMapasGardados()
            .then(data => setMapasGardadosIds(new Set(data.map(m => m.id))))
            .catch(() => {});
    }, [isAuthenticated]);

    async function toggleGardar(mapaId) {
        const gardado = mapasGardadosIds.has(mapaId);
        try {
            if (gardado) {
                await desgardarMapa(mapaId);
                setMapasGardadosIds(prev => { const n = new Set(prev); n.delete(mapaId); return n; });
            } else {
                await gardarMapa(mapaId);
                setMapasGardadosIds(prev => new Set(prev).add(mapaId));
            }
        } catch (err) {
            console.log('Erro ao gardar/desgardar:', err);
        }
    }

    async function buscar() {
        const termo = inputBusca.trim();
        if (!termo) return;

        setCargando(true);
        setErroNominatim(false);
        setMapas([]);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termo)}&limit=1`
            );
            const lugares = await res.json();

            if (!lugares.length) {
                setErroNominatim(true);
                setCargando(false);
                return;
            }

            const { lat, lon } = lugares[0];
            setBuscaActiva(termo);
            await cargarMapas(lat, lon, RADIUS_BUSCA);
        } catch {
            setErroNominatim(true);
            setCargando(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') buscar();
    }

    const tituloSeccion = buscaActiva
        ? `Resultados para "${buscaActiva}" — ${mapas.length} mapa${mapas.length !== 1 ? 's' : ''} atopado${mapas.length !== 1 ? 's' : ''}`
        : 'Mapas destacados';

    return (
        <div className="explorar-page">
            <div className="explorar-page__cabeceira">
                <h1 className="explorar-page__titulo">Explorar mapas</h1>
                <p className="explorar-page__subtitulo">
                    Descubre mapas colaborativos de todo o mundo
                </p>
            </div>

            <div className="explorar-page__buscador">
                <input
                    className="explorar-page__input"
                    type="text"
                    placeholder="Busca unha cidade, rexión ou lugar..."
                    value={inputBusca}
                    onChange={e => setInputBusca(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className="explorar-page__btn-buscar" onClick={buscar}>
                    Buscar
                </button>
            </div>

            <p className="explorar-page__seccion-titulo">{tituloSeccion}</p>

            {!isAuthenticated ? (
                <div className="explorar-page__mensaxe">
                    <p>Inicia sesión para explorar mapas públicos</p>
                    <button
                        className="explorar-card__btn"
                        style={{ marginTop: '12px' }}
                        onClick={() => navigate('/login')}
                    >
                        Iniciar sesión
                    </button>
                </div>
            ) : (
                <>
                    {erroNominatim && (
                        <p className="explorar-page__mensaxe">
                            Non se puido localizar o lugar indicado
                        </p>
                    )}

                    {!erroNominatim && cargando && (
                        <p className="explorar-page__mensaxe">Cargando mapas...</p>
                    )}

                    {!erroNominatim && !cargando && mapas.length === 0 && (
                        <p className="explorar-page__mensaxe">
                            Non se atoparon mapas nesta zona
                        </p>
                    )}
                </>
            )}

            {isAuthenticated && !cargando && mapas.length > 0 && (
                <div className="explorar-page__grid">
                    {mapas.map(mapa => (
                        <div key={mapa.id} className="explorar-card" style={{ position: 'relative' }}>

                            {/* Iconas esquina superior dereita */}
                            <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {isAuthenticated && mapa.creadoPor !== username && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleGardar(mapa.id); }}
                                        title={mapasGardadosIds.has(mapa.id) ? 'Mapa gardado' : 'Gardar mapa'}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: mapasGardadosIds.has(mapa.id) ? 'var(--color-primary-500)' : 'var(--color-text-secondary, #888)',
                                            padding: '4px', display: 'flex', alignItems: 'center',
                                        }}
                                    >
                                        {mapasGardadosIds.has(mapa.id) ? <BookmarkFilledIcon size={18} /> : <BookmarkIcon size={18} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (!isMapaActivo(mapa.id)) {
                                            toggleMapa(mapa.id);
                                        }
                                        navigate('/');
                                    }}
                                    title="Ver no mapa"
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-primary-500)',
                                        padding: '4px', display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <EyeIcon size={18} />
                                </button>
                            </div>

                            <div className="explorar-card__nome" style={{ paddingRight: '56px' }}>{mapa.nome}</div>
                            {mapa.descricion && (
                                <div className="explorar-card__descricion">{mapa.descricion}</div>
                            )}
                            <div className="explorar-card__meta">
                                {mapa.nomeLocalizacion || [mapa.cidade, mapa.pais].filter(Boolean).join(', ')}
                                {mapa.creadoPor && ` · ${mapa.creadoPor}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
