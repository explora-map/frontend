// VisualizarMapasPanel.jsx
// Drawer deslizante que permite activar/desactivar mapas e categorías
// para superpoñer os seus marcadores sobre o mapa principal.

import React, { useState, useEffect } from 'react';
import useMapaVisualStore from '../store/useMapaVisualStore';
import { obterMeusMaps } from '../services/mapaApi';
import { listarMarcadores } from '../services/marcadorApi';
import { listarCategorias } from '../services/categoriaApi';
import textos from '../constants/textos';

/* ---- Icona X para pechar ---- */
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={18} height={18}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

/* ---- Subcompoñente: item dun mapa con toggle e categorías ---- */

function MapaToggleItem({ mapa, marcadores, categorias, cargando, onToggle }) {
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
                            {mapa.tipo === 'PUBLICO' ? textos.mapas.etiquetaPublico : textos.mapas.etiquetaPrivado}
                        </span>
                        {marcadores && (
                            <span className="mapa-toggle-item__count">
                                ({marcadores.length} marcadores)
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isActivo && (
                <div className="mapa-toggle-item__categorias">
                    {cargando ? (
                        <div className="spinner-sm" aria-label={textos.cargando.xenerico} />
                    ) : (
                        (categorias ?? []).map((cat) => {
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
                        })
                    )}
                </div>
            )}
        </div>
    );
}

/* ---- Compoñente principal ---- */

export default function VisualizarMapasPanel({ isOpen, onClose }) {
    const [mapas, setMapas]                       = useState([]);
    const [cargandoMapas, setCargandoMapas]       = useState(false);
    const [cargandoMarcadores, setCargandoMarcadores] = useState({});

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
                const mapasCargados = await obterMeusMaps();
                setMapas(mapasCargados);

                await Promise.all(mapasCargados.map(async (mapa) => {
                    try {
                        const cats = await listarCategorias(mapa.id);
                        setCategoriasMapa(String(mapa.id), cats);
                    } catch {
                        // ignore per-map category load failure
                    }
                }));
            } catch {
                // ignore load failure
            } finally {
                setCargandoMapas(false);
            }
        }

        cargarDatos();
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleToggleMapa(mapaId) {
        const id = String(mapaId);
        const estaActivo = isMapaActivo(id);

        if (!estaActivo && !marcadoresPorMapa[id]) {
            setCargandoMarcadores((prev) => ({ ...prev, [id]: true }));
            try {
                const data = await listarMarcadores(mapaId);
                const cats = categoriasPorMapa[id] ?? [];
                const marcadoresConCor = data.map((m) => {
                    const categoria = cats.find((c) => String(c.id) === String(m.categoriaId));
                    return { ...m, cor: categoria?.cor ?? '#7C52E8' };
                });
                setMarcadoresMapa(id, marcadoresConCor);
                activarTodasCategorias(cats.map((c) => String(c.id)));
            } catch {
                // ignore load failure
            } finally {
                setCargandoMarcadores((prev) => ({ ...prev, [id]: false }));
            }
        }

        toggleMapa(id);
    }

    return (
        <div
            className={`visualizar-panel ${isOpen ? 'visualizar-panel--open' : ''}`}
            aria-label="Panel de visualización de mapas"
        >
            <div className="visualizar-panel__header">
                <h2 className="visualizar-panel__titulo">{textos.nav.visualizarMapas}</h2>
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
                        />
                    ))
                )}
            </div>
        </div>
    );
}
