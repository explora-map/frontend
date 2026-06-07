// MapaPrincipalPage.jsx
// Mapa a pantalla completa.
// Ao buscar unha cidade aparece un panel unificado con tempo + mapas públicos da zona.
// Routing: fetch directo á API OSRM + L.geoJSON (sen leaflet-routing-machine).

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { useNavigate, useLocation } from 'react-router-dom';
import MapViewer from '../components/MapViewer';
import MapSearchBar from '../components/MapSearchBar';
import axiosInstance from '../services/axiosInstance';
import { gardarMapa, desgardarMapa, obterMapasGardados } from '../services/mapaGardadoApi';
import { crearMarcador, listarMarcadores, editarMarcador, eliminarMarcador } from '../services/marcadorApi';
import ConfirmDialog from '../components/ConfirmDialog';
import { BookmarkIcon, BookmarkFilledIcon, EyeIcon } from '../components/Iconas';
import { useAuth } from '../hooks/useAuth';
import useMapaVisualStore from '../store/useMapaVisualStore';
import '../assets/styles/mapas.css';
import '../assets/styles/map-search.css';

const GALICIA = { lat: 42.8782, lng: -8.5448, zoom: 8 };
const MAX_MAPAS_PANEL = 5;

const MODOS = [
    { id: 'coche', label: '🚗 Coche' },
    { id: 'bici',  label: '🚲 Bicicleta' },
    { id: 'pe',    label: '🚶 A pé' },
];

/* ---- Mapeo de códigos WMO ---- */
const WEATHER_CODES = {
    0:  { desc: 'Ceo despexado',           emoji: '☀️'  },
    1:  { desc: 'Principalmente despexado', emoji: '🌤️' },
    2:  { desc: 'Parcialmente nubrado',     emoji: '⛅'  },
    3:  { desc: 'Nubrado',                  emoji: '☁️'  },
    45: { desc: 'Néboa',                    emoji: '🌫️' },
    48: { desc: 'Néboa con xeada',          emoji: '🌫️' },
    51: { desc: 'Chuvisco lixeiro',         emoji: '🌦️' },
    53: { desc: 'Chuvisco moderado',        emoji: '🌦️' },
    55: { desc: 'Chuvisco intenso',         emoji: '🌧️' },
    61: { desc: 'Choiva lixeira',           emoji: '🌧️' },
    63: { desc: 'Choiva moderada',          emoji: '🌧️' },
    65: { desc: 'Choiva intensa',           emoji: '🌧️' },
    71: { desc: 'Nevada lixeira',           emoji: '🌨️' },
    73: { desc: 'Nevada moderada',          emoji: '🌨️' },
    75: { desc: 'Nevada intensa',           emoji: '❄️'  },
    80: { desc: 'Orballo lixeiro',          emoji: '🌦️' },
    81: { desc: 'Orballo moderado',         emoji: '🌧️' },
    82: { desc: 'Orballo intenso',          emoji: '⛈️' },
    95: { desc: 'Treboada',                 emoji: '⛈️' },
};

function mapearCodigo(code) {
    return WEATHER_CODES[code] ?? { desc: 'Tempo variable', emoji: '🌡️' };
}

/* ---- Formulario de novo marcador ---- */

function FormNovaMarcador({ coords, categorias, onGardar, onCancelar }) {
    const [nome, setNome] = useState('');
    const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? '');
    const [gardando, setGardando] = useState(false);
    const [erro, setErro] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (!nome.trim()) { setErro('O nome é obrigatorio'); return; }
        setGardando(true);
        setErro('');
        try {
            await onGardar({ nome: nome.trim(), categoriaId: categoriaId || null, lat: coords.lat, lon: coords.lng });
        } catch {
            setErro('Erro ao gardar o marcador');
            setGardando(false);
        }
    }

    return (
        <div className="panel-rutas">
            <div className="panel-rutas__destino">
                Novo marcador
            </div>
            <form onSubmit={handleSubmit} className="panel-rutas__corpo">
                <input
                    type="text"
                    placeholder="Nome do marcador..."
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="form-input"
                    autoFocus
                />
                {categorias.length > 0 && (
                    <select
                        value={categoriaId}
                        onChange={e => setCategoriaId(e.target.value)}
                        className="form-input"
                    >
                        <option value="">Sen categoría</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                    </select>
                )}
                {erro && (
                    <p className="panel-rutas__erro">{erro}</p>
                )}
                <div className="panel-rutas__fila">
                    <button
                        type="submit"
                        disabled={gardando}
                        className="btn btn--primary btn--sm"
                        style={{ flex: 1, opacity: gardando ? 0.6 : 1 }}
                    >
                        {gardando ? 'Gardando...' : 'Gardar'}
                    </button>
                    <button type="button" onClick={onCancelar} className="btn btn--ghost btn--sm">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ---- Compoñente ---- */

export default function MapaPrincipalPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, username } = useAuth();

    const [coords, setCoords] = useState(GALICIA);

    const [destino, setDestino] = useState(null);

    // Panel unificado: null | 'cargando' | { nome, emoji, temp, desc, vento }
    const [panelCidade, setPanelCidade] = useState(null);
    const [mapasZona, setMapasZona] = useState([]);
    const [cargandoMapas, setCargandoMapas] = useState(false);

    // Directions
    const [mostrarDirections, setMostrarDirections] = useState(false);
    const [modo, setModo] = useState('coche');
    const [mapasGardadosIds, setMapasGardadosIds] = useState(new Set());
    const [inputOrixe, setInputOrixe] = useState('');
    const [infoRuta, setInfoRuta] = useState(null);
    const [erroOrixe, setErroOrixe] = useState('');
    const [calculandoRuta, setCalculandoRuta] = useState(false);

    // Engadir marcador
    const [coordsNovaMarcador, setCoordsNovaMarcador] = useState(null);
    const [mostrarFormMarcador, setMostrarFormMarcador] = useState(false);
    const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

    const [marcadorSeleccionado, setMarcadorSeleccionado] = useState(null);
    const [editandoMarcadorPanel, setEditandoMarcadorPanel] = useState(false);
    const [nomeEditPanel, setNomeEditPanel] = useState('');
    const [descEditPanel, setDescEditPanel] = useState('');
    const [categoriaIdEditPanel, setCategoriaIdEditPanel] = useState('');
    const [gardandoEditPanel, setGardandoEditPanel] = useState(false);
    const [erroEditPanel, setErroEditPanel] = useState('');

    const setCoordsStore          = useMapaVisualStore(s => s.setCoords);
    const mapasActivos            = useMapaVisualStore(s => s.mapasActivos);
    const marcadoresPorMapa       = useMapaVisualStore(s => s.marcadoresPorMapa);
    const categoriasActivas       = useMapaVisualStore(s => s.categoriasActivas);
    const categoriasPorMapa       = useMapaVisualStore(s => s.categoriasPorMapa);
    const mapaIdEngadindo         = useMapaVisualStore(s => s.mapaIdEngadindo);
    const cancelarSolicitudEngadir = useMapaVisualStore(s => s.cancelarSolicitudEngadir);
    const setMarcadoresMapa       = useMapaVisualStore(s => s.setMarcadoresMapa);
    const toggleMapa              = useMapaVisualStore(s => s.toggleMapa);
    const setCategoriasMapa       = useMapaVisualStore(s => s.setCategoriasMapa);
    const activarTodasCategorias  = useMapaVisualStore(s => s.activarTodasCategorias);
    const isMapaActivo            = useMapaVisualStore(s => s.isMapaActivo);

    const coordsAplicadasRef = useRef(null);
    useEffect(() => {
        const store = useMapaVisualStore.getState();
        const ca = store.coordsActuais;
        if (ca && coordsAplicadasRef.current !== `${ca.lat},${ca.lon}`) {
            coordsAplicadasRef.current = `${ca.lat},${ca.lon}`;
            setCoords({ lat: ca.lat, lng: ca.lon, zoom: 13 });
        }
    }, [location]);

    const marcadoresVisuais = useMemo(() => {
        const resultado = [];
        Object.entries(mapasActivos).forEach(([mapaId, activo]) => {
            if (!activo) return;
            const marcadores = marcadoresPorMapa[mapaId] ?? [];
            marcadores.forEach(m => {
                if (m.categoriaId) {
                    const catActiva = categoriasActivas[String(m.categoriaId)];
                    if (catActiva === undefined || catActiva === true) {
                        resultado.push(m);
                    }
                } else {
                    const claveEspecial = `${mapaId}_sen_categoria`;
                    const visible = categoriasActivas[claveEspecial];
                    if (visible === undefined || visible === true) {
                        resultado.push(m);
                    }
                }
            });
        });
        return resultado;
    }, [mapasActivos, marcadoresPorMapa, categoriasActivas]);

    const mapaRef = useRef(null);
    const rutaLayerRef = useRef(null);

    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 13 }),
            () => {},
        );
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;
        obterMapasGardados()
            .then(data => setMapasGardadosIds(new Set(data.map(m => m.id))))
            .catch(() => {});
    }, [isAuthenticated]);

    useEffect(() => {
        return () => {
            try { rutaLayerRef.current?.remove(); } catch { /* mapa xa destruído */ }
        };
    }, []);

    useEffect(() => {
        if (!mapaIdEngadindo) {
            setCoordsNovaMarcador(null);
            setMostrarFormMarcador(false);
            setCategoriasDisponibles([]);
            return;
        }
        const cats = categoriasPorMapa[mapaIdEngadindo] ?? [];
        setCategoriasDisponibles(cats);
        setCoordsNovaMarcador(null);
        setMostrarFormMarcador(false);
    }, [mapaIdEngadindo]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function handleCentrarMapa(e) {
            setCoords({ lat: e.detail.lat, lng: e.detail.lng, zoom: e.detail.zoom ?? 14 });
        }
        window.addEventListener('centrar-mapa', handleCentrarMapa);
        return () => window.removeEventListener('centrar-mapa', handleCentrarMapa);
    }, []);

    /* ---- Gardar mapa ---- */

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

    /* ---- Engadir marcador ---- */

    function cancelarEngadirMarcador() {
        cancelarSolicitudEngadir();
        setCoordsNovaMarcador(null);
        setMostrarFormMarcador(false);
    }

    async function handleGardarMarcador({ nome, categoriaId, lat, lon }) {
        const dto = { nome, latitude: lat, lonxitude: lon };
        if (categoriaId) dto.categoriaId = Number(categoriaId);

        await crearMarcador(mapaIdEngadindo, dto);

        const mapaId = String(mapaIdEngadindo);
        try {
            const data = await listarMarcadores(mapaIdEngadindo);
            const marcadoresConCor = data.map(m => ({
                ...m,
                cor: m.categoriaCor ?? '#888888',
            }));
            setMarcadoresMapa(mapaId, marcadoresConCor);
        } catch { /* ignore */ }

        cancelarSolicitudEngadir();
        setCoordsNovaMarcador(null);
        setMostrarFormMarcador(false);
    }

    /* ---- Routing helpers ---- */

    function limparRuta() {
        if (rutaLayerRef.current) {
            try { rutaLayerRef.current.remove(); } catch { /* ignore */ }
            rutaLayerRef.current = null;
        }
        setInfoRuta(null);
        setErroOrixe('');
    }

    function cancelarDirections() {
        limparRuta();
        setMostrarDirections(false);
        setInputOrixe('');
    }

    /* ---- Panel helpers ---- */

    function fecharPanel() {
        setPanelCidade(null);
        setMapasZona([]);
        cancelarDirections();
        setDestino(null);
    }

    /* ---- Carga de datos ---- */

    async function cargarTempo(lat, lng, nomeCompleto) {
        const nome = nomeCompleto.split(',')[0].trim();
        setPanelCidade('cargando');
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`open-meteo ${res.status}`);
            const data = await res.json();
            const { temperature_2m, weather_code, wind_speed_10m } = data.current;
            const { desc, emoji } = mapearCodigo(weather_code);
            setPanelCidade({
                nome,
                emoji,
                temp:  Math.round(temperature_2m),
                vento: Math.round(wind_speed_10m),
                desc,
            });
        } catch (err) {
            console.log('Panel de tempo: erro Open-Meteo:', err.message);
            setPanelCidade({ nome, emoji: null, temp: null, vento: null, desc: null });
        }
    }

    async function cargarMapas(lat, lng) {
        setCargandoMapas(true);
        setMapasZona([]);
        try {
            const res = await axiosInstance.get(`/mapas/publicos?lat=${lat}&lon=${lng}&radius=100`);
            console.log('Mapas públicos recibidos:', res.data);
            console.log('Params usados:', { lat, lon: lng, radius: 100 });
setMapasZona(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.log('cargarMapas: erro:', err.response?.status, err.response?.data);
            setMapasZona([]);
        } finally {
            setCargandoMapas(false);
        }
    }

    function handleLocationSelect({ lat, lng, zoom, nome }) {
        setCoords({ lat, lng, zoom: zoom ?? 14 });
        if (mapaIdEngadindo) {
            setCoordsNovaMarcador({ lat, lng });
            setMostrarFormMarcador(true);
            return;
        }
        setDestino({ lat, lng });
        cancelarDirections();
        if (nome) cargarTempo(lat, lng, nome);
        cargarMapas(lat, lng);
    }

    async function calcularRuta() {
        if (!inputOrixe.trim() || !destino || !mapaRef.current) return;
        setCalculandoRuta(true);
        setErroOrixe('');
        setInfoRuta(null);
        limparRuta();

        try {
            // Xeocodificar orixe con Nominatim
            const nominatimRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputOrixe.trim())}&limit=1`
            );
            const lugares = await nominatimRes.json();

            if (!lugares.length) {
                setErroOrixe('Non se puido localizar a orixe indicada');
                return;
            }

            const latOrixe  = parseFloat(lugares[0].lat);
            const lonOrixe  = parseFloat(lugares[0].lon);
            const latDestino = destino.lat;
            const lonDestino = destino.lng;

            const perfil = modo === 'coche' ? 'driving'
                         : modo === 'bici'  ? 'cycling'
                         : 'foot';

            const corRuta = modo === 'coche' ? '#7c3aed'
                          : modo === 'bici'  ? '#16a34a'
                          : '#ea580c';

            // URL OSRM: lon,lat order (formato GeoJSON)
            const osrmUrl = `https://router.project-osrm.org/route/v1/${perfil}/` +
                `${lonOrixe},${latOrixe};${lonDestino},${latDestino}` +
                `?overview=full&geometries=geojson`;

            const osrmRes = await fetch(osrmUrl);
            const data    = await osrmRes.json();

            if (!data.routes || data.routes.length === 0) {
                setErroOrixe('Non foi posible calcular a ruta');
                return;
            }

            const ruta = data.routes[0];
            setInfoRuta({
                km:  (ruta.distance / 1000).toFixed(1),
                min: Math.round(ruta.duration / 60),
            });

            // Debuxar a ruta con L.geoJSON
            rutaLayerRef.current = L.geoJSON(ruta.geometry, {
                style: { color: corRuta, weight: 4, opacity: 0.8 },
            }).addTo(mapaRef.current);

            mapaRef.current.fitBounds(rutaLayerRef.current.getBounds(), { padding: [40, 40] });

        } catch (err) {
            console.log('Erro OSRM:', err);
            setErroOrixe('Non foi posible calcular a ruta');
        } finally {
            setCalculandoRuta(false);
        }
    }

    function podeEditarMarcador(marcador) {
        if (!isAuthenticated || !marcador) return false;
        const mapaIdStr = String(marcador.mapaId);
        const activo = mapasActivos[mapaIdStr];
        if (!activo) return false;
        return marcador.creadoPor === username ||
            Object.entries(mapasActivos).some(([id, activo]) => {
                if (!activo || id !== mapaIdStr) return false;
                return true;
            });
    }

    async function handleGardarEditPanel() {
        if (!marcadorSeleccionado || !nomeEditPanel.trim()) return;
        setGardandoEditPanel(true);
        setErroEditPanel('');
        try {
            await editarMarcador(marcadorSeleccionado.id, {
                nome: nomeEditPanel.trim(),
                descricion: descEditPanel,
                categoriaId: categoriaIdEditPanel || null,
                latitude: marcadorSeleccionado.latitude,
                lonxitude: marcadorSeleccionado.lonxitude,
            });
            const mapaIdStr = String(marcadorSeleccionado.mapaId);
            const data = await listarMarcadores(marcadorSeleccionado.mapaId);
            const marcadoresConCor = data.map((m) => ({
                ...m,
                cor: m.categoriaCor ?? '#888888'
            }));
            setMarcadoresMapa(mapaIdStr, marcadoresConCor);
            setMarcadorSeleccionado(null);
            setEditandoMarcadorPanel(false);
        } catch {
            setErroEditPanel('Erro ao gardar o marcador.');
        } finally {
            setGardandoEditPanel(false);
        }
    }

    async function handleEliminarMarcadorPanel() {
        if (!marcadorSeleccionado) return;
        try {
            await eliminarMarcador(marcadorSeleccionado.id);
            const mapaIdStr = String(marcadorSeleccionado.mapaId);
            const data = await listarMarcadores(marcadorSeleccionado.mapaId);
            const marcadoresConCor = data.map((m) => ({
                ...m,
                cor: m.categoriaCor ?? '#888888'
            }));
            setMarcadoresMapa(mapaIdStr, marcadoresConCor);
            setMarcadorSeleccionado(null);
        } catch {
            // ignore
        }
    }

    /* ---- Render ---- */

    async function activarMapaConCategorias(mapaId) {
        if (!isMapaActivo(mapaId)) {
            toggleMapa(mapaId);
        }
        try {
            const [catsRes, marcsRes] = await Promise.all([
                axiosInstance.get(`/mapas/${mapaId}/categorias`),
                axiosInstance.get(`/mapas/${mapaId}/marcadores`),
            ]);
            const cats = catsRes.data ?? [];
            const marcs = marcsRes.data ?? [];
            setCategoriasMapa(String(mapaId), cats);
            setMarcadoresMapa(String(mapaId), marcs);
            activarTodasCategorias(cats.map(c => String(c.id)));
        } catch {
            // silently ignore
        }
    }

    return (
        <div className="mapa-principal-page">

            {/* Barra de busca flotante */}
            <div className="mapa-principal__buscador">
                <MapSearchBar onLocationSelect={handleLocationSelect} />
            </div>

            {/* Panel unificado: tempo + mapas + directions */}
            {panelCidade !== null && (
                <div className="panel-cidade">

                    {/* Cabeceira con tempo */}
                    <div className="panel-cidade__cabeceira">
                        {panelCidade === 'cargando' ? (
                            <p className="panel-cidade__cargando">
                                Cargando...
                            </p>
                        ) : (
                            <div className="panel-cidade__cabeceira-info">
                                <div className="panel-cidade__nome">{panelCidade.nome}</div>
                                {panelCidade.desc && (
                                    <div className="panel-cidade__tempo">
                                        {panelCidade.desc} · 💨 {panelCidade.vento} km/h
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="panel-cidade__tempo-wrapper">
                            {panelCidade !== 'cargando' && panelCidade.temp !== null && (
                                <span className="panel-cidade__tempo-principal">
                                    {panelCidade.emoji} {panelCidade.temp}°C
                                </span>
                            )}
                            <button
                                className="panel-cidade__pechar"
                                onClick={fecharPanel}
                                aria-label="Pechar panel"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Sección de mapas */}
                    <div className="panel-cidade__mapas">
                        <div className="panel-cidade__mapas-titulo">Mapas nesta zona</div>

                        {cargandoMapas && (
                            <p className="panel-cidade__mensaxe">Cargando mapas...</p>
                        )}

                        {!cargandoMapas && mapasZona.length === 0 && (
                            <p className="panel-cidade__mensaxe">Sen mapas nesta zona</p>
                        )}

                        {!cargandoMapas && mapasZona.slice(0, MAX_MAPAS_PANEL).map(mapa => (
                            <div key={mapa.id} className="panel-cidade__mapa-item">
                                <div className="panel-cidade__mapa-info">
                                    <div className="panel-cidade__mapa-nome">{mapa.nome}</div>
                                    <div className="panel-cidade__mapa-autor">por {mapa.creadoPor}</div>
                                </div>
                                {isAuthenticated && mapa.creadoPor !== username && (
                                    <button
                                        onClick={() => toggleGardar(mapa.id)}
                                        title={mapasGardadosIds.has(mapa.id) ? 'Mapa gardado' : 'Gardar mapa'}
                                        className="btn btn--ghost btn--icon"
                                    >
                                        {mapasGardadosIds.has(mapa.id) ? <BookmarkFilledIcon size={18} /> : <BookmarkIcon size={18} />}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        activarMapaConCategorias(mapa.id);
                                        setCoordsStore(mapa.latitude, mapa.lonxitude);
                                        fecharPanel();
                                    }}
                                    title="Ver no mapa"
                                    className="btn btn--ghost btn--icon"
                                >
                                    <EyeIcon size={18} />
                                </button>
                            </div>
                        ))}

                        {!cargandoMapas && mapasZona.length > MAX_MAPAS_PANEL && (
                            <button
                                className="panel-cidade__ver-todos"
                                onClick={() => navigate('/explorar')}
                            >
                                Ver todos ({mapasZona.length})
                            </button>
                        )}
                    </div>

                    {/* Sección de directions integrada no panel */}
                    {destino && (
                        <div className="panel-cidade__directions">
                            {!mostrarDirections ? (
                                <button
                                    className="panel-cidade__directions-btn"
                                    onClick={() => setMostrarDirections(true)}
                                >
                                    Como chegar
                                </button>
                            ) : (
                                <div className="panel-cidade__directions-form">

                                    {/* Selector de modo de transporte */}
                                    <div className="panel-cidade__directions-fila">
                                        {MODOS.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setModo(m.id)}
                                                className={`panel-rutas__modo-btn${modo === m.id ? ' panel-rutas__modo-btn--activo' : ''}`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Input de orixe */}
                                    <input
                                        type="text"
                                        placeholder="Desde: escribe o enderezo de orixe..."
                                        value={inputOrixe}
                                        onChange={e => setInputOrixe(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && calcularRuta()}
                                        className="form-input"
                                        autoFocus
                                    />

                                    {/* Botóns de acción */}
                                    <div className="panel-cidade__fila">
                                        <button
                                            onClick={calcularRuta}
                                            disabled={calculandoRuta || !inputOrixe.trim()}
                                            className="btn btn--primary btn--sm"
                                        >
                                            {calculandoRuta ? 'Calculando...' : 'Calcular ruta'}
                                        </button>
                                        <button onClick={cancelarDirections} className="btn btn--ghost btn--sm">
                                            Cancelar
                                        </button>
                                    </div>

                                    {erroOrixe && (
                                        <p className="panel-rutas__erro">{erroOrixe}</p>
                                    )}

                                    {infoRuta && (
                                        <p>
                                            📍 {infoRuta.km} km · ⏱ {infoRuta.min} min
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Banner de selección de localización */}
            {mapaIdEngadindo && !mostrarFormMarcador && (
                <div className="panel-rutas__info">
                    <span>Estás no modo de edición de marcadores</span>
                    <button
                        onClick={cancelarEngadirMarcador}
                        className="panel-rutas__pechar"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* Formulario de novo marcador */}
            {mostrarFormMarcador && coordsNovaMarcador && (
                <div className="mapa-principal__form-marcador-wrap">
                    <FormNovaMarcador
                        coords={coordsNovaMarcador}
                        categorias={categoriasDisponibles}
                        onGardar={handleGardarMarcador}
                        onCancelar={cancelarEngadirMarcador}
                    />
                </div>
            )}

            {/* Mapa */}
            <div className={`mapa-principal__mapa-wrap${(mapaIdEngadindo && !mostrarFormMarcador) ? ' mapa-principal__mapa-wrap--edicion' : ''}`}>
                <MapViewer
                    latitude={coords.lat}
                    lonxitude={coords.lng}
                    zoom={coords.zoom}
                    marker={!!destino}
                    height="100%"
                    marcadores={marcadoresVisuais}
                    onMarcadorClick={(marcador) => {
                        setMarcadorSeleccionado(marcador);
                        setEditandoMarcadorPanel(false);
                        setNomeEditPanel(marcador.nome);
                        setDescEditPanel(marcador.descricion || '');
                        setCategoriaIdEditPanel(marcador.categoriaId || '');
                        setErroEditPanel('');
                    }}
                    zoomPosition="bottomright"
                    onMapReady={(map) => { mapaRef.current = map; }}
                    onLocationSelect={
                        (mapaIdEngadindo && !mostrarFormMarcador)
                            ? ({ lat, lng }) => {
setCoordsNovaMarcador({ lat, lng });
                                setMostrarFormMarcador(true);
                            }
                            : undefined
                    }
                />
            </div>

            {marcadorSeleccionado && (
                <div className="marcador-popup-flotante">
                    {!editandoMarcadorPanel ? (
                        <>
                            <div className="marcador-popup-flotante__header">
                                <span className="marcador-popup-flotante__nome">{marcadorSeleccionado.nome}</span>
                                <button
                                    className="marcador-popup-flotante__pechar"
                                    onClick={() => setMarcadorSeleccionado(null)}
                                    aria-label="Pechar"
                                >×</button>
                            </div>
                            {marcadorSeleccionado.descricion && (
                                <p className="marcador-popup-flotante__desc">{marcadorSeleccionado.descricion}</p>
                            )}
                            {marcadorSeleccionado.categoriaNome && (
                                <span className="marcador-popup-flotante__categoria">
                                    <span className="categoria-dot" style={{ backgroundColor: marcadorSeleccionado.categoriaCor }} />
                                    {marcadorSeleccionado.categoriaNome}
                                </span>
                            )}
                            {isAuthenticated && (marcadorSeleccionado.creadoPor === username || podeEditarMarcador(marcadorSeleccionado)) && (
                                <div className="marcador-popup-flotante__accions">
                                    <button
                                        className="btn btn--secondary btn--sm"
                                        onClick={() => setEditandoMarcadorPanel(true)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn--danger btn--sm"
                                        onClick={handleEliminarMarcadorPanel}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="marcador-popup-flotante__header">
                                <span className="marcador-popup-flotante__nome">Editar marcador</span>
                                <button
                                    className="marcador-popup-flotante__pechar"
                                    onClick={() => setMarcadorSeleccionado(null)}
                                    aria-label="Pechar"
                                >×</button>
                            </div>
                            <input
                                className="modal-input"
                                value={nomeEditPanel}
                                onChange={(e) => setNomeEditPanel(e.target.value)}
                                placeholder="Nome"
                                disabled={gardandoEditPanel}
                            />
                            <input
                                className="modal-input"
                                value={descEditPanel}
                                onChange={(e) => setDescEditPanel(e.target.value)}
                                placeholder="Descrición"
                                disabled={gardandoEditPanel}
                            />
                            {erroEditPanel && <p className="panel-rutas__erro">{erroEditPanel}</p>}
                            <div className="marcador-popup-flotante__accions">
                                <button
                                    className="btn btn--ghost btn--sm"
                                    onClick={() => setEditandoMarcadorPanel(false)}
                                    disabled={gardandoEditPanel}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn--primary btn--sm"
                                    onClick={handleGardarEditPanel}
                                    disabled={gardandoEditPanel}
                                >
                                    {gardandoEditPanel ? '…' : 'Gardar'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
