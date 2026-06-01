// MapaDetallePage.jsx
// Protected page at /mapas/:id.
// Shows map detail with tabs: xeral, marcadores, categorías, membros, convites, historial.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useMapaVisualStore from '../store/useMapaVisualStore';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { obterMapaPorId, eliminarMapa, cambiarVisibilidade } from '../services/mapaApi';
import { gardarMapa, desgardarMapa, obterMapasGardados } from '../services/mapaGardadoApi';
import { BookmarkIcon, BookmarkFilledIcon } from '../components/Iconas';
import { listarMarcadores, crearMarcador, editarMarcador, eliminarMarcador } from '../services/marcadorApi';
import { listarCategorias } from '../services/categoriaApi';
import { listarMembros } from '../services/mapaMembroApi';
import ConvitePanel from '../components/ConvitePanel';
import CategoriaPanel from '../components/CategoriaPanel';
import MembroPanel from '../components/MembroPanel';
import HistorialPanel from '../components/HistorialPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import FormModal from '../components/FormModal';
import '../assets/styles/mapas.css';

// ---- Address search field used inside marker modals ----
function AddressSearchField({ onSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef(null);
    const wrapperRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        function handleOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    function handleChange(e) {
        const val = e.target.value;
        setQuery(val);
        clearTimeout(debounceRef.current);
        if (val.trim().length < 3) {
            setResults([]);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`;
                const res = await fetch(url, { headers: { 'User-Agent': 'ExploraMap/1.0' } });
                const data = await res.json();
                setResults(data);
                setOpen(data.length > 0);
            } catch {
                setResults([]);
                setOpen(false);
            } finally {
                setLoading(false);
            }
        }, 400);
    }

    function select(resultado) {
        setQuery(resultado.display_name.split(',').slice(0, 2).join(','));
        setResults([]);
        setOpen(false);
        onSelect({
            lat: parseFloat(resultado.lat),
            lng: parseFloat(resultado.lon),
        });
    }

    function handleInputKeyDown(e) {
        if (e.key === 'ArrowDown' && open && results.length > 0) {
            e.preventDefault();
            listRef.current?.querySelector('[role="option"]')?.focus();
        }
        if (e.key === 'Escape') setOpen(false);
    }

    function handleOptionKeyDown(e, resultado, index) {
        if (e.key === 'Enter') {
            e.preventDefault();
            select(resultado);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const opts = listRef.current?.querySelectorAll('[role="option"]');
            opts?.[index + 1]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (index === 0) {
                wrapperRef.current?.querySelector('input')?.focus();
            } else {
                const opts = listRef.current?.querySelectorAll('[role="option"]');
                opts?.[index - 1]?.focus();
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
            wrapperRef.current?.querySelector('input')?.focus();
        }
    }

    return (
        <div className="marcador-busca" ref={wrapperRef}>
            <input
                className="modal-input"
                type="text"
                value={query}
                onChange={handleChange}
                onKeyDown={handleInputKeyDown}
                placeholder="Buscar enderezo..."
                aria-label="Buscar enderezo"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                autoComplete="off"
                disabled={loading}
            />
            {open && results.length > 0 && (
                <ul
                    ref={listRef}
                    className="marcador-busca__dropdown"
                    role="listbox"
                    aria-label="Resultados da busca de enderezo"
                >
                    {results.map((r, i) => (
                        <li
                            key={r.place_id}
                            role="option"
                            className="marcador-busca__option"
                            tabIndex={0}
                            onClick={() => select(r)}
                            onKeyDown={(e) => handleOptionKeyDown(e, r, i)}
                        >
                            {r.display_name.split(',').slice(0, 3).join(',')}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ---- Rol efectivo ----

function calcularRolEfectivo(mapa, membros, username) {
    if (mapa.creadoPor === username) return 'PROPIETARIA';
    const membro = membros.find(m => m.username === username);
    if (!membro) return 'VISITANTE';
    return membro.rol;
}

// ---- Main page component ----

export default function MapaDetallePage() {
    const { id } = useParams();
    const { username, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const invalidarMarcadores = useMapaVisualStore(s => s.invalidarMarcadores);

    function handleVolver() {
        invalidarMarcadores();
        navigate('/mapas');
    }

    const [mapa, setMapa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [categorias, setCategorias] = useState([]);
    const [marcadores, setMarcadores] = useState([]);
    const [membros, setMembros] = useState([]);
    const [rolEfectivo, setRolEfectivo] = useState(null);
    const [gardado, setGardado] = useState(false);
    const [pestanaActiva, setPestanaActiva] = useState('xeral');

    // Create marker form state
    const [mostrarFormMarcador, setMostrarFormMarcador] = useState(false);
    const [coordsMarcador, setCoordsMarcador] = useState(null);
    const [nomeMarcador, setNomeMarcador] = useState('');
    const [descMarcador, setDescMarcador] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [erroMarcador, setErroMarcador] = useState('');
    const [gardandoMarcador, setGardandoMarcador] = useState(false);

    // Edit marker form state
    const [marcadorEditando, setMarcadorEditando] = useState(null);
    const [nomeEdit, setNomeEdit] = useState('');
    const [descEdit, setDescEdit] = useState('');
    const [categoriaIdEdit, setCategoriaIdEdit] = useState('');
    const [coordsEditOverride, setCoordsEditOverride] = useState(null);
    const [erroEdit, setErroEdit] = useState('');
    const [gardandoEdit, setGardandoEdit] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [accionPendente, setAccionPendente] = useState(null);
    // accionPendente: { tipo: 'mapa' } | { tipo: 'marcador', marcador: object }

    const loadCategorias = useCallback(async () => {
        try {
            const data = await listarCategorias(id);
            setCategorias(data);
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

    const loadMembros = useCallback(async () => {
        try {
            const data = await listarMembros(id);
            setMembros(data);
        } catch {
            setMembros([]);
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
        loadMembros();
    }, [id, loadMarcadores, loadCategorias, loadMembros]);

    const isOwner = mapa?.creadoPor === username;

    useEffect(() => {
        if (mapa && membros !== null) {
            setRolEfectivo(calcularRolEfectivo(mapa, membros, username));
        }
    }, [mapa, membros, username]);

    useEffect(() => {
        if (!isAuthenticated) return;
        obterMapasGardados()
            .then(data => setGardado(data.some(m => m.id === parseInt(id))))
            .catch(() => {});
    }, [id, isAuthenticated]);

    async function toggleGardarDetalle() {
        try {
            if (gardado) {
                await desgardarMapa(id);
                setGardado(false);
            } else {
                await gardarMapa(id);
                setGardado(true);
            }
        } catch (err) {
            console.log('Erro ao gardar/desgardar:', err);
        }
    }

    const podeCrear = ['PROPIETARIA', 'ADMIN_MAPA', 'COLABORADORA'].includes(rolEfectivo);
    const podeEditarCalquera = ['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo);

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
                setError(t('erros.xenerico'));
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

    function resetEditMarcador() {
        setMarcadorEditando(null);
        setNomeEdit('');
        setDescEdit('');
        setCategoriaIdEdit('');
        setCoordsEditOverride(null);
        setErroEdit('');
    }

    async function handleCrearMarcador() {
        if (!coordsMarcador) {
            setErroMarcador('Debes seleccionar unha localización (busca un enderezo ou pecha o modal e preme no mapa).');
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
                latitude: coordsEditOverride?.lat ?? marcadorEditando.latitude,
                lonxitude: coordsEditOverride?.lng ?? marcadorEditando.lonxitude,
                categoriaId: categoriaIdEdit ? Number(categoriaIdEdit) : null,
            });
            resetEditMarcador();
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
            title:        t('mapas.confirmEliminarTitulo'),
            message:      t('mapas.confirmEliminarMensaxe'),
            confirmLabel: t('mapas.confirmEliminarBoton'),
          }
        : {
            title:        t('marcadores.confirmEliminarTitulo'),
            message:      t('marcadores.confirmEliminarMensaxe'),
            confirmLabel: t('marcadores.confirmEliminarBoton'),
          };

    if (loading) return <PageShell><p className="state-msg">Cargando mapa…</p></PageShell>;
    if (error) return <PageShell><p className="state-msg state-msg--error">{error}</p></PageShell>;
    if (!mapa) return null;

    const formattedDate = mapa.dataCreacion
        ? new Date(mapa.dataCreacion).toLocaleString()
        : '—';

    const ROL_BADGE = {
        'PROPIETARIA':  { texto: 'O teu mapa', estilo: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' } },
        'ADMIN_MAPA':   { texto: 'Admin',       estilo: { background: '#faf5ff', color: '#7c3aed', border: '1px solid #c4b5fd' } },
        'COLABORADORA': { texto: 'Colaboras',   estilo: { background: '#eff6ff', color: '#2563eb', border: '1px solid #93c5fd' } },
    };

    return (
        <PageShell>
            {/* Cabeceira */}
            <div className="page__back">
                <button className="back-link" onClick={handleVolver}>← Volver aos mapas</button>
            </div>

            <div className="detalle__header">
                <div className="detalle__header-info">
                    <h1 className="page__title">{mapa.nome}</h1>
                    <div className="detalle__header-badges">
                        <span className={`badge badge--tipo badge--${mapa.tipo === 'PUBLICO' ? 'publico' : 'privado'}`}>
                            {mapa.tipo === 'PUBLICO' ? 'Público' : 'Privado'}
                        </span>
                        {ROL_BADGE[rolEfectivo] && (
                            <span style={{
                                fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                                display: 'inline-block',
                                ...ROL_BADGE[rolEfectivo].estilo,
                            }}>
                                {ROL_BADGE[rolEfectivo].texto}
                            </span>
                        )}
                        {isAuthenticated && mapa?.creadoPor !== username && (
                            <button
                                onClick={toggleGardarDetalle}
                                title={gardado ? 'Mapa gardado' : 'Gardar mapa'}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: gardado ? 'var(--color-primary-500)' : 'var(--color-text-secondary, #888)',
                                    padding: '4px',
                                    display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle',
                                }}
                            >
                                {gardado ? <BookmarkFilledIcon size={22} /> : <BookmarkIcon size={22} />}
                            </button>
                        )}
                    </div>
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

            {/* Navegación de pestanas */}
            <nav className="detalle__tabs">
                <button
                    className={`detalle__tab${pestanaActiva === 'xeral' ? ' detalle__tab--activa' : ''}`}
                    onClick={() => setPestanaActiva('xeral')}
                >
                    {t('detalle.tabXeral')}
                </button>
                <button
                    className={`detalle__tab${pestanaActiva === 'marcadores' ? ' detalle__tab--activa' : ''}`}
                    onClick={() => setPestanaActiva('marcadores')}
                >
                    {t('detalle.tabMarcadores')}
                </button>
                <button
                    className={`detalle__tab${pestanaActiva === 'categorias' ? ' detalle__tab--activa' : ''}`}
                    onClick={() => setPestanaActiva('categorias')}
                >
                    {t('detalle.tabCategorias')}
                </button>
                {['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo) && (
                    <button
                        className={`detalle__tab${pestanaActiva === 'membros' ? ' detalle__tab--activa' : ''}`}
                        onClick={() => setPestanaActiva('membros')}
                    >
                        {t('detalle.tabMembros')}
                    </button>
                )}
                {['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo) && (
                    <button
                        className={`detalle__tab${pestanaActiva === 'convites' ? ' detalle__tab--activa' : ''}`}
                        onClick={() => setPestanaActiva('convites')}
                    >
                        {t('detalle.tabConvites')}
                    </button>
                )}
                {['PROPIETARIA', 'ADMIN_MAPA', 'COLABORADORA'].includes(rolEfectivo) && (
                    <button
                        className={`detalle__tab${pestanaActiva === 'historial' ? ' detalle__tab--activa' : ''}`}
                        onClick={() => setPestanaActiva('historial')}
                    >
                        {t('detalle.tabHistorial')}
                    </button>
                )}
            </nav>

            {/* Contido das pestanas */}

            {pestanaActiva === 'xeral' && (
                <div className="detalle__tab-contido">
                    {mapa.descricion && <p className="detalle__descricion">{mapa.descricion}</p>}
                    <dl className="detalle__meta">
                        <dt>{t('detalle.localizacion')}</dt>
                        <dd>{mapa.nomeLocalizacion}</dd>
                        <dt>{t('detalle.creadoPor')}</dt>
                        <dd>{mapa.creadoPor}</dd>
                        <dt>{t('detalle.dataCreacion')}</dt>
                        <dd>{formattedDate}</dd>
                        <dt>{t('detalle.coordenadas')}</dt>
                        <dd>Lat: {mapa.latitude} · Lng: {mapa.lonxitude}</dd>
                    </dl>
                </div>
            )}

            {pestanaActiva === 'marcadores' && (
                <div className="detalle__tab-contido">
                    {podeCrear && (
                        <div className="detalle__tab-accions">
                            <button
                                className="btn btn--primary btn--sm"
                                onClick={() => setMostrarFormMarcador(true)}
                            >
                                {t('detalle.engadirMarcador')}
                            </button>
                        </div>
                    )}
                    {marcadores.length === 0 && (
                        <p className="state-msg">{t('detalle.senMarcadores')}</p>
                    )}
                    {marcadores.length > 0 && (
                        <ul className="marcadores-lista">
                            {marcadores.map((marcador) => (
                                <li key={marcador.id} className="marcador-item">
                                    <span className="marcador-item__nome">{marcador.nome}</span>
                                    {marcador.categoriaNome && (
                                        <span className="marcador-item__categoria">
                                            <span className="categoria-dot" style={{ backgroundColor: marcador.categoriaCor }} />
                                            <span>{marcador.categoriaNome}</span>
                                        </span>
                                    )}
                                    <span className="marcador-item__coords">
                                        Lat: {marcador.latitude.toFixed(4)} · Lng: {marcador.lonxitude.toFixed(4)}
                                    </span>
                                    {(podeEditarCalquera || marcador.creadoPor === username) && (
                                        <div className="marcador-item__accions">
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => {
                                                    setMarcadorEditando(marcador);
                                                    setNomeEdit(marcador.nome);
                                                    setDescEdit(marcador.descricion || '');
                                                    setCategoriaIdEdit(marcador.categoriaId || '');
                                                    setCoordsEditOverride(null);
                                                    setErroEdit('');
                                                }}
                                            >
                                                {t('detalle.editar')}
                                            </button>
                                            <button
                                                className="btn btn--danger btn--sm"
                                                onClick={() => solicitarEliminarMarcador(marcador)}
                                            >
                                                {t('detalle.eliminar')}
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {pestanaActiva === 'categorias' && (
                <div className="detalle__tab-contido">
                    <CategoriaPanel
                        mapaId={id}
                        esPropietario={mapa.creadoPor === username}
                        categorias={categorias}
                        onCambio={async () => { await loadCategorias(); await loadMarcadores(); }}
                        podeCrear={podeCrear}
                        podeEditarCalquera={podeEditarCalquera}
                        usernameActual={username}
                    />
                </div>
            )}

            {pestanaActiva === 'membros' && ['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo) && (
                <div className="detalle__tab-contido">
                    <MembroPanel mapaId={mapa.id} creadoPor={mapa.creadoPor} tipoMapa={mapa.tipo} />
                </div>
            )}

            {pestanaActiva === 'convites' && ['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo) && (
                <div className="detalle__tab-contido">
                    <ConvitePanel mapaId={mapa.id} tipoMapa={mapa.tipo} />
                </div>
            )}

            {pestanaActiva === 'historial' && ['PROPIETARIA', 'ADMIN_MAPA', 'COLABORADORA'].includes(rolEfectivo) && (
                <div className="detalle__tab-contido">
                    <HistorialPanel mapaId={mapa.id} usuarioActual={username} />
                </div>
            )}

            {/* ---- Create marker modal ---- */}
            {mostrarFormMarcador && (
                <FormModal title="Engadir marcador" onClose={resetFormMarcador}>
                    <p className="marcador-busca__coords-info">
                        {coordsMarcador
                            ? `Lat: ${coordsMarcador.lat.toFixed(4)}, Lng: ${coordsMarcador.lng.toFixed(4)}`
                            : 'Selecciona un enderezo ou pecha o modal e preme no mapa'}
                    </p>
                    <div className="modal-field">
                        <label className="modal-label">Enderezo</label>
                        <AddressSearchField
                            onSelect={({ lat, lng }) => setCoordsMarcador({ lat, lng })}
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Nome *</label>
                        <input
                            className={`modal-input${erroMarcador && !nomeMarcador.trim() ? ' modal-input--error' : ''}`}
                            type="text"
                            value={nomeMarcador}
                            onChange={(e) => setNomeMarcador(e.target.value)}
                            disabled={gardandoMarcador}
                            aria-label="Nome do marcador"
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Descrición (opcional)</label>
                        <textarea
                            className="modal-input"
                            value={descMarcador}
                            onChange={(e) => setDescMarcador(e.target.value)}
                            disabled={gardandoMarcador}
                            rows={3}
                            aria-label="Descrición do marcador"
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Categoría (opcional)</label>
                        <select
                            className="modal-input"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value)}
                            disabled={gardandoMarcador}
                            aria-label="Categoría do marcador"
                        >
                            <option value="">Sen categoría</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                        </select>
                    </div>
                    {erroMarcador && <p className="modal-error">{erroMarcador}</p>}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="modal-btn-cancelar"
                            onClick={resetFormMarcador}
                            disabled={gardandoMarcador}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="modal-btn-gardar"
                            onClick={handleCrearMarcador}
                            disabled={gardandoMarcador}
                        >
                            {gardandoMarcador ? 'Gardando…' : 'Gardar'}
                        </button>
                    </div>
                </FormModal>
            )}

            {/* ---- Edit marker modal ---- */}
            {marcadorEditando && (
                <FormModal title="Editar marcador" onClose={resetEditMarcador}>
                    <p className="marcador-busca__coords-info">
                        Lat: {(coordsEditOverride?.lat ?? marcadorEditando.latitude).toFixed(4)},
                        {' '}Lng: {(coordsEditOverride?.lng ?? marcadorEditando.lonxitude).toFixed(4)}
                    </p>
                    <div className="modal-field">
                        <label className="modal-label">Cambiar localización (opcional)</label>
                        <AddressSearchField
                            onSelect={({ lat, lng }) => setCoordsEditOverride({ lat, lng })}
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Nome *</label>
                        <input
                            className={`modal-input${erroEdit && !nomeEdit.trim() ? ' modal-input--error' : ''}`}
                            type="text"
                            value={nomeEdit}
                            onChange={(e) => setNomeEdit(e.target.value)}
                            disabled={gardandoEdit}
                            aria-label="Nome do marcador"
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Descrición (opcional)</label>
                        <textarea
                            className="modal-input"
                            value={descEdit}
                            onChange={(e) => setDescEdit(e.target.value)}
                            disabled={gardandoEdit}
                            rows={3}
                            aria-label="Descrición do marcador"
                        />
                    </div>
                    <div className="modal-field">
                        <label className="modal-label">Categoría (opcional)</label>
                        <select
                            className="modal-input"
                            value={categoriaIdEdit}
                            onChange={(e) => setCategoriaIdEdit(e.target.value)}
                            disabled={gardandoEdit}
                            aria-label="Categoría do marcador"
                        >
                            <option value="">Sen categoría</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                            ))}
                        </select>
                    </div>
                    {erroEdit && <p className="modal-error">{erroEdit}</p>}
                    <div className="modal-actions">
                        <button
                            type="button"
                            className="modal-btn-cancelar"
                            onClick={resetEditMarcador}
                            disabled={gardandoEdit}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="modal-btn-gardar"
                            onClick={handleEditarMarcador}
                            disabled={gardandoEdit}
                        >
                            {gardandoEdit ? 'Gardando…' : 'Gardar'}
                        </button>
                    </div>
                </FormModal>
            )}

            {/* ---- Confirm dialog ---- */}
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
            <main className="page__main">{children}</main>
        </div>
    );
}
