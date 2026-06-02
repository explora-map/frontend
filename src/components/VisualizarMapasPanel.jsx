// VisualizarMapasPanel.jsx
// Drawer deslizante que permite activar/desactivar mapas e categorías
// para superpoñer os seus marcadores sobre o mapa principal.

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useMapaVisualStore from '../store/useMapaVisualStore';
import { useAuth } from '../hooks/useAuth';
import { obterMeusMaps, obterColaboracions, obterMapasGardados, obterMapasPublicos } from '../services/mapaApi';
import { listarMarcadores } from '../services/marcadorApi';
import { listarCategorias } from '../services/categoriaApi';

/* ---- Icona X para pechar ---- */
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={18} height={18}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ---- Subcompoñente: item dun mapa con toggle e categorías ---- */

function MapaToggleItem({ mapa, marcadores, categorias, cargando, onToggle, onEngadirMarcador, onGestionar, username }) {
    const { t } = useTranslation();
    const mapasActivos    = useMapaVisualStore((s) => s.mapasActivos);
    const categoriasActivas = useMapaVisualStore((s) => s.categoriasActivas);
    const toggleCategoria = useMapaVisualStore((s) => s.toggleCategoria);

    const isActivo = Boolean(mapasActivos[String(mapa.id)]);

    return (
        <div className="mapa-toggle-item">
            <div className="mapa-toggle-item__header">
                <button
                    role="switch"
                    aria-checked={isActivo}
                    className={`toggle-switch ${isActivo ? 'toggle-switch--on' : ''}`}
                    onClick={() => onToggle(mapa.id)}
                >
                    <span className="sr-only">
                        {isActivo ? 'Desactivar' : 'Activar'} {mapa.nome}
                    </span>
                    <span className="toggle-switch__thumb" />
                </button>

                <div className="mapa-toggle-item__info">
                    <div className="mapa-toggle-item__nome">{mapa.nome}</div>
                    <div className="mapa-toggle-item__meta">
                        <span className={`badge badge--${mapa.tipo === 'PUBLICO' ? 'publico' : 'privado'}`}>
                            {mapa.tipo === 'PUBLICO' ? t('mapas.etiquetaPublico') : t('mapas.etiquetaPrivado')}
                        </span>
                        {marcadores && (
                            <span className="mapa-toggle-item__count">
                                ({marcadores.length} marcadores)
                            </span>
                        )}
                    </div>
                </div>

                <div className="mapa-toggle-item__btns">
                    {isActivo && username && onGestionar && (
                        <button
                            className="mapa-toggle-item__btn-xestionar"
                            onClick={() => onGestionar(mapa.id)}
                            title="Ir á páxina do mapa"
                            aria-label={`Ir á páxina de ${mapa.nome}`}
                        >
                            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={16} height={16}>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                <polyline points="15 3 21 3 21 9"/>
                                <line x1="10" y1="14" x2="21" y2="3"/>
                            </svg>
                        </button>
                    )}
                    {isActivo && username && onEngadirMarcador && (
                        <button
                            className="mapa-toggle-item__btn-engadir"
                            onClick={() => onEngadirMarcador(mapa.id)}
                            title={t('visualizar.engadirMarcador', 'Engadir marcador')}
                            aria-label={`Engadir marcador en ${mapa.nome}`}
                        >
                            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={16} height={16}>
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {isActivo && (
                <div className="mapa-toggle-item__categorias">
                    {cargando ? (
                        <div className="spinner-sm" aria-label={t('cargando.xenerico')} />
                    ) : (
                        <>
                            {(categorias ?? []).map((cat) => {
                                const activa = Boolean(categoriasActivas[String(cat.id)]);
                                return (
                                    <button
                                        key={cat.id}
                                        className="categoria-toggle"
                                        onClick={() => toggleCategoria(String(cat.id))}
                                        aria-pressed={activa}
                                    >
                                        <span
                                            className="categoria-toggle__cor"
                                            style={{
                                                backgroundColor: cat.cor,
                                                opacity: activa ? 1 : 0.3,
                                            }}
                                        />
                                        <span
                                            className="categoria-toggle__nome"
                                            style={{ opacity: activa ? 1 : 0.5 }}
                                        >
                                            {cat.nome}
                                        </span>
                                    </button>
                                );
                            })}
                            {(() => {
                                const tenSenCategoria = (marcadores ?? [])
                                    .some(m => !m.categoriaId);
                                if (!tenSenCategoria) return null;
                                const claveEspecial = `${mapa.id}_sen_categoria`;
                                const activa = categoriasActivas[claveEspecial] !== false;
                                return (
                                    <button
                                        key="sen-categoria"
                                        className="categoria-toggle"
                                        onClick={() => toggleCategoria(claveEspecial)}
                                        aria-pressed={activa}
                                    >
                                        <span
                                            className="categoria-toggle__cor"
                                            style={{
                                                backgroundColor: '#888888',
                                                opacity: activa ? 1 : 0.3,
                                            }}
                                        />
                                        <span
                                            className="categoria-toggle__nome"
                                            style={{ opacity: activa ? 1 : 0.5 }}
                                        >
                                            Sen categoría
                                        </span>
                                    </button>
                                );
                            })()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

/* ---- Compoñente principal ---- */

export default function VisualizarMapasPanel({ isOpen, onClose, lat, lon }) {
    const { t } = useTranslation();
    const { username } = useAuth();
    const navigate = useNavigate();
    const [mapas, setMapas]                       = useState([]);
    const [cargandoMapas, setCargandoMapas]       = useState(false);
    const [cargandoMarcadores, setCargandoMarcadores] = useState({});

    const coordsActuais              = useMapaVisualStore((s) => s.coordsActuais);
    const solicitarEngadirMarcador   = useMapaVisualStore((s) => s.solicitarEngadirMarcador);
    const marcadoresPorMapa    = useMapaVisualStore((s) => s.marcadoresPorMapa);
    const categoriasPorMapa    = useMapaVisualStore((s) => s.categoriasPorMapa);
    const setMarcadoresMapa    = useMapaVisualStore((s) => s.setMarcadoresMapa);
    const setCategoriasMapa    = useMapaVisualStore((s) => s.setCategoriasMapa);
    const toggleMapa           = useMapaVisualStore((s) => s.toggleMapa);
    const isMapaActivo         = useMapaVisualStore((s) => s.isMapaActivo);
    const activarTodasCategorias = useMapaVisualStore((s) => s.activarTodasCategorias);

    useEffect(() => {
        if (!isOpen) return;

        async function cargarDatos() {
            setCargandoMapas(true);
            try {
                const [propios, colaboracions, gardados] = await Promise.allSettled([
                    obterMeusMaps(),
                    obterColaboracions(),
                    obterMapasGardados(),
                ]);

                const extraerValor = (r) => r.status === 'fulfilled' ? r.value : [];

                const idsVistos = new Set();
                const todosMapas = [];

                for (const mapa of [
                    ...extraerValor(propios),
                    ...extraerValor(colaboracions),
                    ...extraerValor(gardados),
                ]) {
                    if (!idsVistos.has(mapa.id)) {
                        idsVistos.add(mapa.id);
                        todosMapas.push(mapa);
                    }
                }

                // Mapas públicos da zona (usa coords do props ou do store)
                const latActual = lat ?? coordsActuais?.lat;
                const lonActual = lon ?? coordsActuais?.lon;
                if (latActual && lonActual) {
                    try {
                        const publicos = await obterMapasPublicos(latActual, lonActual, 50);
                        for (const mapa of publicos) {
                            if (!idsVistos.has(mapa.id)) {
                                idsVistos.add(mapa.id);
                                todosMapas.push(mapa);
                            }
                        }
                    } catch {
                        // ignore
                    }
                }

                setMapas(todosMapas);

                await Promise.all(todosMapas.map(async (mapa) => {
                    try {
                        const cats = await listarCategorias(mapa.id);
                        setCategoriasMapa(String(mapa.id), cats);
                    } catch {
                        // ignore
                    }
                }));
            } catch {
                // ignore
            } finally {
                setCargandoMapas(false);
            }
        }

        cargarDatos();
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleToggleMapa(mapaId) {
        const id = String(mapaId);
        const estaActivo = isMapaActivo(id);

        if (!estaActivo) {
            setCargandoMarcadores((prev) => ({ ...prev, [id]: true }));
            try {
                const data = await listarMarcadores(mapaId);
                const cats = categoriasPorMapa[id] ?? [];
                const marcadoresConCor = data.map((m) => ({
                    ...m,
                    cor: m.categoriaCor ?? '#888888'
                }));
                setMarcadoresMapa(id, marcadoresConCor);
                activarTodasCategorias([
                    ...cats.map((c) => String(c.id)),
                    `${id}_sen_categoria`
                ]);
            } catch {
                // ignore load failure
            } finally {
                setCargandoMarcadores((prev) => ({ ...prev, [id]: false }));
            }
        }

        toggleMapa(id);
    }

    function handleEngadirMarcador(mapaId) {
        solicitarEngadirMarcador(mapaId);
        onClose();
    }

    return (
        <div
            className={`visualizar-panel ${isOpen ? 'visualizar-panel--open' : ''}`}
            aria-label="Panel de visualización de mapas"
        >
            <div className="visualizar-panel__header">
                <h2 className="visualizar-panel__titulo">{t('visualizar.titulo')}</h2>
                <button
                    className="btn btn--icon visualizar-panel__btn-pechar"
                    onClick={onClose}
                    aria-label="Pechar panel de visualización"
                >
                    <span
                        style={{
                            position: 'relative',
                            display: 'inline-flex',
                            width: '16px',
                            height: '16px',
                            flexShrink: 0,
                        }}
                        aria-hidden="true"
                    >
                        <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0',
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '2px',
                            transform: 'translateY(-50%) rotate(45deg)',
                        }} />
                        <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0',
                            width: '100%',
                            height: '2px',
                            backgroundColor: 'currentColor',
                            borderRadius: '2px',
                            transform: 'translateY(-50%) rotate(-45deg)',
                        }} />
                    </span>
                </button>
            </div>

            <div className="visualizar-panel__body">
                {cargandoMapas ? (
                    <div className="visualizar-panel__skeleton">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton-item" />
                        ))}
                    </div>
                ) : (
                    mapas.map((mapa) => (
                        <MapaToggleItem
                            key={mapa.id}
                            mapa={mapa}
                            marcadores={marcadoresPorMapa[String(mapa.id)]}
                            categorias={categoriasPorMapa[String(mapa.id)]}
                            cargando={Boolean(cargandoMarcadores[String(mapa.id)])}
                            onToggle={handleToggleMapa}
                            onEngadirMarcador={handleEngadirMarcador}
                            onGestionar={(mapaId) => { navigate(`/mapas/${mapaId}`); onClose(); }}
                            username={username}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
