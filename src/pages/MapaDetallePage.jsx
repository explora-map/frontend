// MapaDetallePage.jsx
// Protected page at /mapas/:id.
// Shows map detail with a Leaflet map. If owner: edit/delete/visibility/invitations.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { obterMapaPorId, eliminarMapa, cambiarVisibilidade } from '../services/mapaApi';
import { listarMarcadores, crearMarcador, editarMarcador, eliminarMarcador } from '../services/marcadorApi';
import { listarCategorias } from '../services/categoriaApi';
import MapViewer from '../components/MapViewer';
import ConvitePanel from '../components/ConvitePanel';
import CategoriaPanel from '../components/CategoriaPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import textos from '../constants/textos';
import '../assets/styles/mapas.css';

export default function MapaDetallePage() {
    const { id } = useParams();
    const { username } = useAuth();
    const navigate = useNavigate();

    const [mapa, setMapa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [marcadores, setMarcadores] = useState([]);
    const [mostrarFormMarcador, setMostrarFormMarcador] = useState(false);
    const [categoriaId, setCategoriaId] = useState('');
    const [nomeMarcador, setNomeMarcador] = useState('');
    const [descMarcador, setDescMarcador] = useState('');
    const [coordsMarcador, setCoordsMarcador] = useState(null);
    const [erroMarcador, setErroMarcador] = useState('');
    const [gardandoMarcador, setGardandoMarcador] = useState(false);
    const [categoriasFiltro, setCategoriasFiltro] = useState(new Set());
    const [marcadorEditando, setMarcadorEditando] = useState(null);
    const [nomeEdit, setNomeEdit] = useState('');
    const [descEdit, setDescEdit] = useState('');
    const [categoriaIdEdit, setCategoriaIdEdit] = useState('');
    const [erroEdit, setErroEdit] = useState('');
    const [gardandoEdit, setGardandoEdit] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [accionPendente, setAccionPendente] = useState(null);
    // accionPendente: { tipo: 'mapa' } | { tipo: 'marcador', marcador: object }

    const loadCategorias = useCallback(async () => {
        try {
            const data = await listarCategorias(id);
            setCategorias(data);
            setCategoriasFiltro(new Set(data.map(c => c.id)));
        } catch {
            setError('Non foi posible cargar as categorías.');
        }
    }, [id]);

    const loadMarcadores = useCallback(async () => {
        try {
            const data = await listarMarcadores(id);
            setMarcadores(data);
        } catch {
            setError('Non foi posible cargar os marcadores.');
        }
    }, [id]);

    useEffect(() => {
        setLoading(true);
        setError('');
        obterMapaPorId(id)
            .then(setMapa)
            .catch(() => setError('Non foi posible cargar o mapa.'))
            .finally(() => setLoading(false));
        loadMarcadores();
        loadCategorias();
    }, [id, loadMarcadores, loadCategorias]);

    const isOwner = mapa?.creadoPor === username;

    function toggleCategoria(categoriaId) {
        setCategoriasFiltro(prev => {
            const novo = new Set(prev);
            if (novo.has(categoriaId)) {
                novo.delete(categoriaId);
            } else {
                novo.add(categoriaId);
            }
            return novo;
        });
    }

    function solicitarEliminarMapa() {
        setAccionPendente({ tipo: 'mapa' });
        setConfirmOpen(true);
    }

    function solicitarEliminarMarcador(marcador) {
        setAccionPendente({ tipo: 'marcador', marcador });
        setConfirmOpen(true);
    }

    async function executarAccionPendente() {
        const pendente = accionPendente;
        setConfirmOpen(false);
        setAccionPendente(null);

        if (pendente?.tipo === 'mapa') {
            setDeleting(true);
            try {
                await eliminarMapa(id);
                navigate('/mapas');
            } catch {
                setError(textos.mapas.errorEliminarMapa);
                setDeleting(false);
            }
        } else if (pendente?.tipo === 'marcador') {
            try {
                await eliminarMarcador(pendente.marcador.id);
                await loadMarcadores();
            } catch {
                setError('Non foi posible eliminar o marcador.');
            }
        }
    }

    function resetFormMarcador() {
        setNomeMarcador('');
        setDescMarcador('');
        setCoordsMarcador(null);
        setErroMarcador('');
        setGardandoMarcador(false);
        setMostrarFormMarcador(false);
        setCategoriaId('');
    }

    async function handleCrearMarcador() {
        if (!coordsMarcador) {
            setErroMarcador('Debes seleccionar unha localización no mapa.');
            return;
        }
        if (!nomeMarcador.trim()) {
            setErroMarcador('O nome do marcador é obrigatorio.');
            return;
        }
        setErroMarcador('');
        setGardandoMarcador(true);
        try {
            await crearMarcador(id, {
                nome: nomeMarcador,
                descricion: descMarcador,
                latitude: coordsMarcador.lat,
                lonxitude: coordsMarcador.lng,
                categoriaId: categoriaId || null,
            });
            resetFormMarcador();
            await loadMarcadores();
        } catch (err) {
            setErroMarcador(err.response?.data?.message || 'Erro ao gardar o marcador.');
        } finally {
            setGardandoMarcador(false);
        }
    }

    async function handleEditarMarcador() {
        if (!nomeEdit.trim()) {
            setErroEdit('O nome do marcador é obrigatorio.');
            return;
        }
        setGardandoEdit(true);
        try {
            await editarMarcador(marcadorEditando.id, {
                nome: nomeEdit,
                descricion: descEdit,
                latitude: marcadorEditando.latitude,
                lonxitude: marcadorEditando.lonxitude,
                categoriaId: categoriaIdEdit ? Number(categoriaIdEdit) : null,
            });
            setMarcadorEditando(null);
            setNomeEdit('');
            setDescEdit('');
            setCategoriaIdEdit('');
            setErroEdit('');
            await loadMarcadores();
        } catch (err) {
            setErroEdit(err.response?.data?.message || 'Erro ao gardar');
        } finally {
            setGardandoEdit(false);
        }
    }

    async function handleToggleVisibility() {
        setToggling(true);
        try {
            const novoTipo = mapa.tipo === 'PUBLICO' ? 'PRIVADO' : 'PUBLICO';
            const updated = await cambiarVisibilidade(id, novoTipo);
            setMapa(updated);
        } catch {
            // silently ignore — the badge stays unchanged if the request fails
        } finally {
            setToggling(false);
        }
    }

    const confirmConfig = accionPendente?.tipo === 'mapa'
        ? {
            title:        textos.mapas.confirmEliminarTitulo,
            message:      textos.mapas.confirmEliminarMensaxe,
            confirmLabel: textos.mapas.confirmEliminarBoton,
          }
        : {
            title:        textos.marcadores.confirmEliminarTitulo,
            message:      textos.marcadores.confirmEliminarMensaxe,
            confirmLabel: textos.marcadores.confirmEliminarBoton,
          };

    const marcadoresFiltrados = marcadores.filter(m =>
        m.categoriaId === null ? true : categoriasFiltro.has(m.categoriaId)
    );

    if (loading) return <PageShell><p className="state-msg">Cargando mapa…</p></PageShell>;
    if (error) return <PageShell><p className="state-msg state-msg--error">{error}</p></PageShell>;
    if (!mapa) return null;

    const formattedDate = mapa.dataCreacion
        ? new Date(mapa.dataCreacion).toLocaleString()
        : '—';

    return (
        <PageShell>
            <div className="page__back">
                <Link to="/mapas" className="back-link">← Volver aos mapas</Link>
            </div>

            <div className="detalle__header">
                <div>
                    <h1 className="page__title">{mapa.nome}</h1>
                    <span className={`badge badge--tipo badge--${mapa.tipo === 'PUBLICO' ? 'publico' : 'privado'}`}>
                        {mapa.tipo === 'PUBLICO' ? 'Público' : 'Privado'}
                    </span>
                </div>

                {isOwner && (
                    <div className="detalle__owner-actions">
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleToggleVisibility}
                            disabled={toggling}
                        >
                            {toggling ? '…' : mapa.tipo === 'PUBLICO' ? '🔒 Facer privado' : '🔓 Facer público'}
                        </button>
                        <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => navigate(`/mapas/${id}/editar`)}
                        >
                            Editar
                        </button>
                        <button
                            className="btn btn--danger btn--sm"
                            onClick={solicitarEliminarMapa}
                            disabled={deleting}
                        >
                            {deleting ? 'Eliminando…' : 'Eliminar'}
                        </button>
                    </div>
                )}
            </div>

            {isOwner && !mostrarFormMarcador && (
                <div className="detalle__marcadores-actions">
                    <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => setMostrarFormMarcador(true)}
                    >
                        Engadir marcador
                    </button>
                </div>
            )}

            {categorias.length > 0 && (
                <div className="detalle__filtros">
                    <span className="detalle__filtros-label">Filtrar por categoría</span>
                    {categorias.map((categoria) => (
                        <button
                            key={categoria.id}
                            className={`btn btn--sm ${categoriasFiltro.has(categoria.id) ? 'btn--primary' : 'btn--ghost'}`}
                            onClick={() => toggleCategoria(categoria.id)}
                        >
                            <span style={{ backgroundColor: categoria.cor, width: 12, height: 12, display: 'inline-block', borderRadius: '50%', marginRight: 6 }} />
                            {categoria.nome}
                        </button>
                    ))}
                </div>
            )}

            <MapViewer
                latitude={mostrarFormMarcador && coordsMarcador ? coordsMarcador.lat : mapa.latitude}
                lonxitude={mostrarFormMarcador && coordsMarcador ? coordsMarcador.lng : mapa.lonxitude}
                zoom={13}
                marker={mostrarFormMarcador ? coordsMarcador !== null : true}
                height="400px"
                marcadores={marcadoresFiltrados}
                {...(mostrarFormMarcador && { onLocationSelect: (coords) => setCoordsMarcador(coords) })}
            />

            {mostrarFormMarcador && (
                <div className="form-marcador">
                    <p className="form-marcador__hint">
                        {coordsMarcador
                            ? `Localización seleccionada: ${coordsMarcador.lat.toFixed(4)}, ${coordsMarcador.lng.toFixed(4)}`
                            : 'Preme no mapa para seleccionar a localización'}
                    </p>
                    <div className="form-group">
                        <label className="form-label" htmlFor="nomeMarcador">Nome *</label>
                        <input
                            id="nomeMarcador"
                            className="form-input"
                            type="text"
                            value={nomeMarcador}
                            onChange={(e) => setNomeMarcador(e.target.value)}
                            disabled={gardandoMarcador}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="descMarcador">Descrición (opcional)</label>
                        <textarea
                            id="descMarcador"
                            className="form-input form-textarea"
                            value={descMarcador}
                            onChange={(e) => setDescMarcador(e.target.value)}
                            disabled={gardandoMarcador}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="categoriaId">Categoría (opcional)</label>
                        <select
                            id="categoriaId"
                            className="form-input"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            disabled={gardandoMarcador}
                        >
                            <option value="">Sen categoría</option>
                            {categorias.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>
                                    [{categoria.cor}] {categoria.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    {erroMarcador && <p className="form-error">{erroMarcador}</p>}
                    <div className="form-marcador__btns">
                        <button
                            className="btn btn--primary btn--sm"
                            onClick={handleCrearMarcador}
                            disabled={gardandoMarcador}
                        >
                            {gardandoMarcador ? 'Gardando…' : 'Gardar'}
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                                setMostrarFormMarcador(false);
                                setNomeMarcador('');
                                setDescMarcador('');
                                setCoordsMarcador(null);
                                setErroMarcador('');
                                setGardandoMarcador(false);
                                setCategoriaId('');
                            }}
                            disabled={gardandoMarcador}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {marcadores.length > 0 && (
                <div className="detalle__marcadores">
                    <h2 className="section__title">Marcadores</h2>
                    <ul className="marcadores-lista">
                        {marcadores.map((marcador) => (
                            <li key={marcador.id} className="marcador-item">
                                {marcadorEditando?.id === marcador.id ? (
                                    <>
                                        <input
                                            className="form-input"
                                            type="text"
                                            value={nomeEdit}
                                            onChange={(e) => setNomeEdit(e.target.value)}
                                            disabled={gardandoEdit}
                                            aria-label="Nome do marcador"
                                        />
                                        <textarea
                                            className="form-input form-textarea"
                                            value={descEdit}
                                            onChange={(e) => setDescEdit(e.target.value)}
                                            disabled={gardandoEdit}
                                            rows={2}
                                            aria-label="Descrición do marcador"
                                        />
                                        <select
                                            className="form-input"
                                            value={categoriaIdEdit}
                                            onChange={(e) => setCategoriaIdEdit(e.target.value)}
                                            disabled={gardandoEdit}
                                            aria-label="Categoría do marcador"
                                        >
                                            <option value="">Sen categoría</option>
                                            {categorias.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    [{cat.cor}] {cat.nome}
                                                </option>
                                            ))}
                                        </select>
                                        {erroEdit && <p className="form-error">{erroEdit}</p>}
                                        <button
                                            className="btn btn--primary btn--sm"
                                            onClick={handleEditarMarcador}
                                            disabled={gardandoEdit}
                                        >
                                            {gardandoEdit ? 'Gardando…' : 'Gardar'}
                                        </button>
                                        <button
                                            className="btn btn--ghost btn--sm"
                                            onClick={() => {
                                                setMarcadorEditando(null);
                                                setNomeEdit('');
                                                setDescEdit('');
                                                setCategoriaIdEdit('');
                                                setErroEdit('');
                                            }}
                                            disabled={gardandoEdit}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span className="marcador-item__nome">{marcador.nome}</span>
                                        {marcador.categoriaNome && (
                                            <span>
                                                <span style={{ backgroundColor: marcador.categoriaCor, width: 12, height: 12, display: 'inline-block', borderRadius: '50%', marginRight: 6 }} />
                                                <span style={{ color: 'grey' }}>{marcador.categoriaNome}</span>
                                            </span>
                                        )}
                                        <span className="marcador-item__coords">
                                            Lat: {marcador.latitude.toFixed(4)} · Lng: {marcador.lonxitude.toFixed(4)}
                                        </span>
                                        {marcador.creadoPor === username && (
                                            <>
                                                <button
                                                    className="btn btn--ghost btn--sm"
                                                    onClick={() => {
                                                        setMarcadorEditando(marcador);
                                                        setNomeEdit(marcador.nome);
                                                        setDescEdit(marcador.descricion || '');
                                                        setCategoriaIdEdit(marcador.categoriaId || '');
                                                        setErroEdit('');
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="btn btn--danger btn--sm"
                                                    onClick={() => solicitarEliminarMarcador(marcador)}
                                                >
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <CategoriaPanel
                mapaId={id}
                esPropietario={mapa.creadoPor === username}
                categorias={categorias}
                onCambio={async () => { await loadCategorias(); await loadMarcadores(); }}
            />

            <div className="detalle__info">
                {mapa.descricion && (
                    <p className="detalle__descricion">{mapa.descricion}</p>
                )}
                <dl className="detalle__meta">
                    <dt>Localización</dt>
                    <dd>{mapa.nomeLocalizacion}</dd>
                    <dt>Creado por</dt>
                    <dd>{mapa.creadoPor}</dd>
                    <dt>Data de creación</dt>
                    <dd>{formattedDate}</dd>
                    <dt>Coordenadas</dt>
                    <dd className="coords-display coords-display--inline">
                        <span>Lat: {mapa.latitude}</span>
                        <span>Lng: {mapa.lonxitude}</span>
                    </dd>
                </dl>
            </div>

            {isOwner && (
                <div className="detalle__invitations">
                    <ConvitePanel mapaId={mapa.id} />
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                {...confirmConfig}
                variant="danger"
                onConfirm={executarAccionPendente}
                onCancel={() => { setConfirmOpen(false); setAccionPendente(null); }}
            />
        </PageShell>
    );
}

function PageShell({ children }) {
    return (
        <div className="page">
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
            <main className="page__main">{children}</main>
        </div>
    );
}
