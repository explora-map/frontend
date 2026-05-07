// ConvitesPage.jsx
// Protected page at /convites.
// Two tabs: sent invitations (Enviados) and received invitations (Recibidos).

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    obterConvitesEnviados,
    obterConvitesRecibidos,
    cancelarConvite,
    aceptarConvite,
    rexeitarConvite,
} from '../services/conviteApi';
import textos from '../constants/textos';
import '../assets/styles/mapas.css';

const ESTADO_LABEL = {
    PENDENTE: textos.convites.estadoPendente,
    ACEPTADO: textos.convites.estadoAceptado,
    REXEITADO: textos.convites.estadoRexeitado,
    CANCELADO: textos.convites.estadoCancelado,
    EXPIRADO: textos.convites.estadoExpirado,
};

export default function ConvitesPage() {
    const [activeTab, setActiveTab] = useState('enviados');

    const [enviados, setEnviados] = useState([]);
    const [loadingEnviados, setLoadingEnviados] = useState(true);
    const [errorEnviados, setErrorEnviados] = useState('');

    const [recibidos, setRecibidos] = useState([]);
    const [loadingRecibidos, setLoadingRecibidos] = useState(true);
    const [errorRecibidos, setErrorRecibidos] = useState('');

    const loadEnviados = useCallback(async () => {
        setLoadingEnviados(true);
        setErrorEnviados('');
        try {
            setEnviados(await obterConvitesEnviados());
        } catch {
            setErrorEnviados(textos.convites.errorCargarEnviados);
        } finally {
            setLoadingEnviados(false);
        }
    }, []);

    const loadRecibidos = useCallback(async () => {
        setLoadingRecibidos(true);
        setErrorRecibidos('');
        try {
            setRecibidos(await obterConvitesRecibidos());
        } catch {
            setErrorRecibidos(textos.convites.errorCargarRecibidos);
        } finally {
            setLoadingRecibidos(false);
        }
    }, []);

    useEffect(() => {
        loadEnviados();
        loadRecibidos();
    }, [loadEnviados, loadRecibidos]);

    async function handleCancel(token) {
        try {
            await cancelarConvite(token);
            setEnviados((prev) => prev.filter((c) => c.token !== token));
        } catch {
            // silently ignore
        }
    }

    async function handleAceptar(token) {
        try {
            await aceptarConvite(token);
            setRecibidos((prev) =>
                prev.map((c) => (c.token === token ? { ...c, estado: 'ACEPTADO' } : c)),
            );
        } catch {
            // silently ignore
        }
    }

    async function handleRexeitar(token) {
        try {
            await rexeitarConvite(token);
            setRecibidos((prev) =>
                prev.map((c) => (c.token === token ? { ...c, estado: 'REXEITADO' } : c)),
            );
        } catch {
            // silently ignore
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
                    <Link to="/convites" className="topbar__nav-link topbar__nav-link--active">{textos.nav.convites}</Link>
                </nav>
            </header>

            <main className="page__main">
                <h1 className="page__title">{textos.convites.titulo}</h1>

                {/* Tabs */}
                <div className="tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'enviados'}
                        className={`tab${activeTab === 'enviados' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('enviados')}
                    >
                        {textos.convites.tabEnviados}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'recibidos'}
                        className={`tab${activeTab === 'recibidos' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('recibidos')}
                    >
                        {textos.convites.tabRecibidos}
                        {recibidos.filter((c) => c.estado === 'PENDENTE').length > 0 && (
                            <span className="tab__badge">
                                {recibidos.filter((c) => c.estado === 'PENDENTE').length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Enviados panel */}
                {activeTab === 'enviados' && (
                    <div role="tabpanel">
                        {loadingEnviados && <p className="state-msg">{textos.cargando.xenerico}</p>}
                        {errorEnviados && <p className="state-msg state-msg--error">{errorEnviados}</p>}
                        {!loadingEnviados && !errorEnviados && enviados.length === 0 && (
                            <p className="state-msg">{textos.convites.sinConvitesEnviados}</p>
                        )}
                        {!loadingEnviados && enviados.length > 0 && (
                            <ul className="convite-list">
                                {enviados.map((c) => (
                                    <li key={c.token} className="convite-item">
                                        <div className="convite-item__info">
                                            <Link to={`/mapas/${c.mapaId}`} className="convite-item__map">
                                                {c.mapaNome}
                                            </Link>
                                            <span className="convite-item__user">→ {c.usernameConvidada}</span>
                                        </div>
                                        <div className="convite-item__actions">
                                            <span className={`badge badge--estado badge--${c.estado.toLowerCase()}`}>
                                                {ESTADO_LABEL[c.estado] ?? c.estado}
                                            </span>
                                            {c.estado === 'PENDENTE' && (
                                                <button
                                                    className="btn btn--danger btn--sm"
                                                    onClick={() => handleCancel(c.token)}
                                                >
                                                    {textos.convites.botonCancelar}
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Recibidos panel */}
                {activeTab === 'recibidos' && (
                    <div role="tabpanel">
                        {loadingRecibidos && <p className="state-msg">{textos.cargando.xenerico}</p>}
                        {errorRecibidos && <p className="state-msg state-msg--error">{errorRecibidos}</p>}
                        {!loadingRecibidos && !errorRecibidos && recibidos.length === 0 && (
                            <p className="state-msg">{textos.convites.sinConvitesRecibidos}</p>
                        )}
                        {!loadingRecibidos && recibidos.length > 0 && (
                            <ul className="convite-list">
                                {recibidos.map((c) => (
                                    <li key={c.token} className="convite-item">
                                        <div className="convite-item__info">
                                            <Link to={`/mapas/${c.mapaId}`} className="convite-item__map">
                                                {c.mapaNome}
                                            </Link>
                                            <span className="convite-item__user">de {c.usernameAnfitrioa}</span>
                                        </div>
                                        <div className="convite-item__actions">
                                            <span className={`badge badge--estado badge--${c.estado.toLowerCase()}`}>
                                                {ESTADO_LABEL[c.estado] ?? c.estado}
                                            </span>
                                            {c.estado === 'PENDENTE' && (
                                                <>
                                                    <button
                                                        className="btn btn--primary btn--sm"
                                                        onClick={() => handleAceptar(c.token)}
                                                    >
                                                        {textos.convites.botonAceptar}
                                                    </button>
                                                    <button
                                                        className="btn btn--ghost btn--sm"
                                                        onClick={() => handleRexeitar(c.token)}
                                                    >
                                                        {textos.convites.botonRexeitar}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
