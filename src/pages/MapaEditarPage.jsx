// MapaEditarPage.jsx
// Protected page at /mapas/:id/editar.
// Pre-fills form with existing map data. Only accessible to the map owner.

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { obterMapaPorId, editarMapa } from '../services/mapaApi';
import FormInput from '../components/FormInput';
import MapViewer from '../components/MapViewer';
import textos from '../constants/textos';
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
            .catch(() => setFetchError(textos.mapas.errorCargarMapa))
            .finally(() => setLoadingMap(false));
    }, [id, username, navigate]);

    function validate() {
        const e = {};
        if (!nome.trim()) e.nome = textos.mapas.validNomeObrigatorio;
        else if (nome.trim().length > 100) e.nome = textos.mapas.validNomeLongo;
        if (!nomeLocalizacion.trim()) e.nomeLocalizacion = textos.mapas.validLocalizacionObrigatoria;
        else if (nomeLocalizacion.trim().length > 200) e.nomeLocalizacion = textos.mapas.validLocalizacionLonga;
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
                err.response?.data?.message || textos.mapas.errorEditarMapa,
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingMap) {
        return (
            <PageShell id={id}>
                <p className="state-msg">{textos.cargando.mapa}</p>
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
                <Link to={`/mapas/${id}`} className="back-link">{textos.mapas.voltarAoMapa}</Link>
            </div>
            <h1 className="page__title">{textos.mapas.tituloPaxinaEditar}</h1>

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
                    <label className="field__label">{textos.mapas.etiquetaLocalizacion}</label>
                    <p className="field__hint">{textos.mapas.axudaLocalizacionEditar}</p>
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
                        {textos.mapas.botonCancelar}
                    </button>
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={submitting}
                    >
                        {submitting ? textos.cargando.gardando : textos.mapas.botonGardarCambios}
                    </button>
                </div>
            </form>
        </PageShell>
    );
}

function PageShell({ id, children }) {
    return (
        <div className="page">
            <main className="page__main page__main--narrow">{children}</main>
        </div>
    );
}
