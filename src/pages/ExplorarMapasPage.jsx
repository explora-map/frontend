import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { gardarMapa, desgardarMapa, obterMapasGardados } from '../services/mapaGardadoApi';
import { BookmarkIcon, BookmarkFilledIcon, EyeIcon } from '../components/Iconas';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import useMapaVisualStore from '../store/useMapaVisualStore';

const LAT_GALICIA = 42.8782;
const LON_GALICIA = -8.5448;
const RADIUS_DESTACADOS = 50000;
const RADIUS_BUSCA = 50000;

export default function ExplorarMapasPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isAuthenticated, username } = useAuth();
    const { toggleMapa, isMapaActivo } = useMapaVisualStore();
    const setCategoriasMapa      = useMapaVisualStore(s => s.setCategoriasMapa);
    const activarTodasCategorias = useMapaVisualStore(s => s.activarTodasCategorias);

    const [inputBusca, setInputBusca] = useState('');
    const [mapasGardadosIds, setMapasGardadosIds] = useState(new Set());
    const [buscaActiva, setBuscaActiva] = useState('');
    const [mapas, setMapas] = useState([]);
    const [cargando, setCargando] = useState(false);

    const cargarMapas = useCallback(async (lat, lon, radius) => {
        setCargando(true);
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
    }, []);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude: lat, longitude: lon } = pos.coords;
                    cargarMapas(lat, lon, RADIUS_BUSCA);
                },
                () => {}
            );
        }
    }, [cargarMapas]);

    useEffect(() => {
        if (!isAuthenticated) return;
        obterMapasGardados().then(lista => {
            setMapasGardadosIds(new Set(lista.map(m => m.id)));
        }).catch(() => {});
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
        setMapas([]);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termo)}&limit=1`
            );
            const lugares = await res.json();

            if (!lugares.length) {
                setCargando(false);
                return;
            }

            const { lat, lon } = lugares[0];
            setBuscaActiva(termo);
            await cargarMapas(lat, lon, RADIUS_BUSCA);
        } catch {
            setCargando(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') buscar();
    }

    const tituloSeccion = buscaActiva
        ? `Resultados para "${buscaActiva}" — ${mapas.length} mapa${mapas.length !== 1 ? 's' : ''} atopado${mapas.length !== 1 ? 's' : ''}`
        : 'Mapas destacados';

    async function activarMapaConCategorias(mapaId) {
        if (!isMapaActivo(mapaId)) {
            toggleMapa(mapaId);
        }
        try {
            const res = await axiosInstance.get(`/mapas/${mapaId}/categorias`);
            const cats = res.data ?? [];
            setCategoriasMapa(String(mapaId), cats);
            activarTodasCategorias(cats.map(c => String(c.id)));
        } catch {
            // silently ignore
        }
    }

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

            {cargando && (
                <p className="explorar-page__mensaxe">Cargando mapas...</p>
            )}
            {!cargando && mapas.length === 0 && (
                <p className="explorar-page__mensaxe">{t('explorar.senResultados')}</p>
            )}
            {!cargando && mapas.length > 0 && (
                <div className="explorar-page__grid">
                    {mapas.map(mapa => (
                        <div key={mapa.id} className="explorar-card" style={{ position: 'relative' }}>
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
                                        activarMapaConCategorias(mapa.id);
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
                            <div className="explorar-card__meta">{mapa.cidade || mapa.nomeLocalizacion}</div>
                            <div className="explorar-card__meta">{mapa.rexion && mapa.pais ? `${mapa.rexion} · ${mapa.pais}` : ''} · {mapa.creadoPor}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
