// MapaEditarPage.jsx
// Protected page at /mapas/:id/editar.
// Pre-fills form with existing map data. Only accessible to the map owner.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { obterMapaPorId, editarMapa } from '../services/mapaApi';
import FormInput from '../components/FormInput';
import MapViewer from '../components/MapViewer';
import '../assets/styles/mapas.css';

export default function MapaEditarPage() {
    const { id } = useParams();
    const { username } = useAuth();
    const navigate = useNavigate();

    const [loadingMap, setLoadingMap] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [nome, setNome] = useState('');
    const [descricion, setDescricion] = useState('');
    const [nomeLocalizacion, setNomeLocalizacion] = useState('');
    const [tipo, setTipo] = useState('PUBLICO');
    const [lat, setLat] = useState(0);
    const [lng, setLng] = useState(0);

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        setLoadingMap(true);
        obterMapaPorId(id)
            .then((mapa) => {
                // Redirect if not the owner
                if (mapa.creadoPor !== username) {
                    navigate(`/mapas/${id}`, { replace: true });
                    return;
                }
                setNome(mapa.nome);
                setDescricion(mapa.descricion ?? '');
                setNomeLocalizacion(mapa.nomeLocalizacion);
                setTipo(mapa.tipo);
                setLat(mapa.latitude);
                setLng(mapa.lonxitude);
            })
            .catch(() => setFetchError('Non foi posible cargar o mapa.'))
            .finally(() => setLoadingMap(false));
    }, [id, username, navigate]);

    function validate() {
        const e = {};
        if (!nome.trim()) e.nome = 'O nome é obrigatorio.';
        else if (nome.trim().length > 100) e.nome = 'O nome non pode superar 100 caracteres.';
        if (!nomeLocalizacion.trim()) e.nomeLocalizacion = 'A localización é obrigatoria.';
        else if (nomeLocalizacion.trim().length > 200) e.nomeLocalizacion = 'A localización non pode superar 200 caracteres.';
        return e;
    }

    function handleLocationSelect({ lat: newLat, lng: newLng }) {
        setLat(newLat);
        setLng(newLng);
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
            await editarMapa(id, {
                nome: nome.trim(),
                descricion: descricion.trim() || undefined,
                latitude: lat,
                lonxitude: lng,
                nomeLocalizacion: nomeLocalizacion.trim(),
                tipo,
            });
            navigate(`/mapas/${id}`);
        } catch (err) {
            setServerError(
                err.response?.data?.message || 'Non foi posible gardar os cambios.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingMap) {
        return (
            <PageShell id={id}>
                <p className="state-msg">Cargando mapa…</p>
            </PageShell>
        );
    }

    if (fetchError) {
        return (
            <PageShell id={id}>
                <p className="state-msg state-msg--error">{fetchError}</p>
            </PageShell>
        );
    }

    return (
        <PageShell id={id}>
            <div className="page__back">
                <Link to={`/mapas/${id}`} className="back-link">← Volver ao mapa</Link>
            </div>
            <h1 className="page__title">Editar mapa</h1>

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
                    <label className="field__label">Localización no mapa</label>
                    <p className="field__hint">Arrastra o marcador ou fai clic para cambiar a localización.</p>
                    <MapViewer
                        latitude={lat}
                        lonxitude={lng}
                        zoom={13}
                        marker
                        markerDraggable
                        onLocationSelect={handleLocationSelect}
                        height="350px"
                    />
                    <div className="coords-display">
                        <span>Lat: {lat.toFixed(6)}</span>
                        <span>Lng: {lng.toFixed(6)}</span>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => navigate(`/mapas/${id}`)}
                        disabled={submitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={submitting}
                    >
                        {submitting ? 'Gardando…' : 'Gardar cambios'}
                    </button>
                </div>
            </form>
        </PageShell>
    );
}

function PageShell({ id, children }) {
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
            <main className="page__main page__main--narrow">{children}</main>
        </div>
    );
}
