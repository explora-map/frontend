// MapaCrearPage.jsx
// Protected page at /mapas/novo.
// Form to create a new map with an interactive Leaflet map to pick coordinates.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearMapa } from '../services/mapaApi';
import FormInput from '../components/FormInput';
import MapViewer from '../components/MapViewer';
import MapSearchBar from '../components/MapSearchBar';
import textos from '../constants/textos';
import '../assets/styles/mapas.css';

const DEFAULT_LAT = 42.8782;  // Galicia center-ish
const DEFAULT_LNG = -8.5448;

export default function MapaCrearPage() {
    const navigate = useNavigate();

    const [nome, setNome] = useState('');
    const [descricion, setDescricion] = useState('');
    const [nomeLocalizacion, setNomeLocalizacion] = useState('');
    const [tipo, setTipo] = useState('PUBLICO');
    const [lat, setLat] = useState(DEFAULT_LAT);
    const [lng, setLng] = useState(DEFAULT_LNG);
    const [coordsPicked, setCoordsPicked] = useState(false);

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    function validate() {
        const e = {};
        if (!nome.trim()) e.nome = textos.mapas.validNomeObrigatorio;
        else if (nome.trim().length > 100) e.nome = textos.mapas.validNomeLongo;
        if (!nomeLocalizacion.trim()) e.nomeLocalizacion = textos.mapas.validLocalizacionObrigatoria;
        else if (nomeLocalizacion.trim().length > 200) e.nomeLocalizacion = textos.mapas.validLocalizacionLonga;
        if (!coordsPicked) e.coords = textos.mapas.validCoordsObrigatorias;
        return e;
    }

    function handleBuscaLocalizacion({ lat, lng, nome }) {
        setLat(lat);
        setLng(lng);
        setNomeLocalizacion(nome.split(',').slice(0, 2).join(','));
        setCoordsPicked(true);
        setErrors((prev) => ({ ...prev, coords: undefined, nomeLocalizacion: undefined }));
    }

    function handleLocationSelect({ lat: newLat, lng: newLng }) {
        setLat(newLat);
        setLng(newLng);
        setCoordsPicked(true);
        // Clear coord error if it was shown
        setErrors((prev) => ({ ...prev, coords: undefined }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        setServerError('');
        try {
            const mapa = await crearMapa({
                nome: nome.trim(),
                descricion: descricion.trim() || undefined,
                latitude: lat,
                lonxitude: lng,
                nomeLocalizacion: nomeLocalizacion.trim(),
                tipo,
            });
            navigate(`/mapas/${mapa.id}`);
        } catch (err) {
            setServerError(
                err.response?.data?.message || textos.mapas.errorCrearMapa,
            );
        } finally {
            setSubmitting(false);
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
                    <Link to="/mapas" className="topbar__nav-link">{textos.nav.osMenusMapas}</Link>
                    <Link to="/convites" className="topbar__nav-link">{textos.nav.convites}</Link>
                </nav>
            </header>

            <main className="page__main page__main--narrow">
                <div className="page__back">
                    <Link to="/mapas" className="back-link">{textos.mapas.voltarAosMapas}</Link>
                </div>
                <h1 className="page__title">{textos.mapas.tituloPaxinaCrear}</h1>

                {serverError && (
                    <div className="alert alert--error">{serverError}</div>
                )}

                <form className="mapa-form" onSubmit={handleSubmit} noValidate>
                    <FormInput
                        id="nome"
                        label={textos.mapas.campoNomeLabel}
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        onBlur={() => {
                            if (!nome.trim()) setErrors((p) => ({ ...p, nome: textos.mapas.validNomeObrigatorio }));
                            else setErrors((p) => ({ ...p, nome: undefined }));
                        }}
                        error={errors.nome}
                        placeholder={textos.mapas.placeholderNome}
                        required
                    />

                    <div className="field">
                        <label htmlFor="descricion" className="field__label">{textos.mapas.campoDescripcion}</label>
                        <textarea
                            id="descricion"
                            className="field__textarea"
                            value={descricion}
                            onChange={(e) => setDescricion(e.target.value)}
                            placeholder={textos.mapas.placeholderDescripcion}
                            rows={3}
                        />
                    </div>

                    <FormInput
                        id="nomeLocalizacion"
                        label={textos.mapas.campoNomeLocalizacion}
                        value={nomeLocalizacion}
                        onChange={(e) => setNomeLocalizacion(e.target.value)}
                        onBlur={() => {
                            if (!nomeLocalizacion.trim()) setErrors((p) => ({ ...p, nomeLocalizacion: textos.mapas.validLocalizacionObrigatoria }));
                            else setErrors((p) => ({ ...p, nomeLocalizacion: undefined }));
                        }}
                        error={errors.nomeLocalizacion}
                        placeholder={textos.mapas.placeholderNomeLocalizacion}
                        required
                    />

                    <div className="field">
                        <label htmlFor="tipo" className="field__label">{textos.mapas.campoVisibilidade}</label>
                        <select
                            id="tipo"
                            className="field__select"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="PUBLICO">{textos.mapas.opcionPublico}</option>
                            <option value="PRIVADO">{textos.mapas.opcionPrivado}</option>
                        </select>
                    </div>

                    <div className="field">
                        <label className="field__label">
                            {textos.mapas.etiquetaLocalizacion} <span className="field__required" aria-hidden="true"> *</span>
                        </label>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <MapSearchBar
                                onLocationSelect={handleBuscaLocalizacion}
                                placeholder="Buscar localización do mapa…"
                            />
                        </div>
                        <p className="field__hint">{textos.mapas.axudaLocalizacionCrear}</p>
                        <MapViewer
                            latitude={lat}
                            lonxitude={lng}
                            zoom={7}
                            marker={coordsPicked}
                            onLocationSelect={handleLocationSelect}
                            height="350px"
                        />
                        {coordsPicked && (
                            <div className="coords-display">
                                <span>Lat: {lat.toFixed(6)}</span>
                                <span>Lng: {lng.toFixed(6)}</span>
                            </div>
                        )}
                        {errors.coords && (
                            <p className="field__error" role="alert">{errors.coords}</p>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn--ghost"
                            onClick={() => navigate('/mapas')}
                            disabled={submitting}
                        >
                            {textos.mapas.botonCancelar}
                        </button>
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? textos.cargando.gardando : textos.mapas.botonCrear}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
