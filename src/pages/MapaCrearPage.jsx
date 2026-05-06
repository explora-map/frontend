// MapaCrearPage.jsx
// Protected page at /mapas/novo.
// Form to create a new map with an interactive Leaflet map to pick coordinates.

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { crearMapa } from '../services/mapaApi';
import FormInput from '../components/FormInput';
import MapViewer from '../components/MapViewer';
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
        if (!nome.trim()) e.nome = 'O nome é obrigatorio.';
        else if (nome.trim().length > 100) e.nome = 'O nome non pode superar 100 caracteres.';
        if (!nomeLocalizacion.trim()) e.nomeLocalizacion = 'A localización é obrigatoria.';
        else if (nomeLocalizacion.trim().length > 200) e.nomeLocalizacion = 'A localización non pode superar 200 caracteres.';
        if (!coordsPicked) e.coords = 'Fai clic no mapa para seleccionar unha localización.';
        return e;
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
                err.response?.data?.message || 'Non foi posible crear o mapa. Inténtao de novo.',
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
                    <Link to="/mapas" className="topbar__nav-link">Os meus mapas</Link>
                    <Link to="/convites" className="topbar__nav-link">Convites</Link>
                </nav>
            </header>

            <main className="page__main page__main--narrow">
                <div className="page__back">
                    <Link to="/mapas" className="back-link">← Volver aos mapas</Link>
                </div>
                <h1 className="page__title">Novo mapa</h1>

                {serverError && (
                    <div className="alert alert--error">{serverError}</div>
                )}

                <form className="mapa-form" onSubmit={handleSubmit} noValidate>
                    <FormInput
                        id="nome"
                        label="Nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        onBlur={() => {
                            if (!nome.trim()) setErrors((p) => ({ ...p, nome: 'O nome é obrigatorio.' }));
                            else setErrors((p) => ({ ...p, nome: undefined }));
                        }}
                        error={errors.nome}
                        placeholder="Nome do mapa"
                        required
                    />

                    <div className="field">
                        <label htmlFor="descricion" className="field__label">Descrición</label>
                        <textarea
                            id="descricion"
                            className="field__textarea"
                            value={descricion}
                            onChange={(e) => setDescricion(e.target.value)}
                            placeholder="Descrición opcional…"
                            rows={3}
                        />
                    </div>

                    <FormInput
                        id="nomeLocalizacion"
                        label="Nome da localización"
                        value={nomeLocalizacion}
                        onChange={(e) => setNomeLocalizacion(e.target.value)}
                        onBlur={() => {
                            if (!nomeLocalizacion.trim()) setErrors((p) => ({ ...p, nomeLocalizacion: 'A localización é obrigatoria.' }));
                            else setErrors((p) => ({ ...p, nomeLocalizacion: undefined }));
                        }}
                        error={errors.nomeLocalizacion}
                        placeholder="Ex: Santiago de Compostela"
                        required
                    />

                    <div className="field">
                        <label htmlFor="tipo" className="field__label">Visibilidade</label>
                        <select
                            id="tipo"
                            className="field__select"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="PUBLICO">Público</option>
                            <option value="PRIVADO">Privado</option>
                        </select>
                    </div>

                    <div className="field">
                        <label className="field__label">
                            Localización no mapa <span className="field__required" aria-hidden="true"> *</span>
                        </label>
                        <p className="field__hint">Fai clic no mapa para seleccionar a localización.</p>
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
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Gardando…' : 'Crear mapa'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
