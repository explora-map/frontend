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
import '../assets/styles/mapas.css';

const ESTADO_LABEL = {
    PENDENTE: 'Pendente',
    ACEPTADO: 'Aceptado',
    REXEITADO: 'Rexeitado',
    CANCELADO: 'Cancelado',
    EXPIRADO: 'Expirado',
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
            setErrorEnviados('Non foi posible cargar os convites enviados.');
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
            setErrorRecibidos('Non foi posible cargar os convites recibidos.');
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
            alert('Non foi posible cancelar o convite.');
        }
    }

    async function handleAceptar(token) {
        try {
            await aceptarConvite(token);
            setRecibidos((prev) =>
                prev.map((c) => (c.token === token ? { ...c, estado: 'ACEPTADO' } : c)),
            );
        } catch {
            alert('Non foi posible aceptar o convite.');
        }
    }

    async function handleRexeitar(token) {
        try {
            await rexeitarConvite(token);
            setRecibidos((prev) =>
                prev.map((c) => (c.token === token ? { ...c, estado: 'REXEITADO' } : c)),
            );
        } catch {
            alert('Non foi posible rexeitar o convite.');
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
                    <Link to="/convites" className="topbar__nav-link topbar__nav-link--active">Convites</Link>
                </nav>
            </header>

            <main className="page__main">
                <h1 className="page__title">Convites</h1>

                {/* Tabs */}
                <div className="tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'enviados'}
                        className={`tab${activeTab === 'enviados' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('enviados')}
                    >
                        Enviados
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'recibidos'}
                        className={`tab${activeTab === 'recibidos' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('recibidos')}
                    >
                        Recibidos
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
                        {loadingEnviados && <p className="state-msg">Cargando…</p>}
                        {errorEnviados && <p className="state-msg state-msg--error">{errorEnviados}</p>}
                        {!loadingEnviados && !errorEnviados && enviados.length === 0 && (
                            <p className="state-msg">Non enviaches ningún convite.</p>
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
                                                    Cancelar
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
                        {loadingRecibidos && <p className="state-msg">Cargando…</p>}
                        {errorRecibidos && <p className="state-msg state-msg--error">{errorRecibidos}</p>}
                        {!loadingRecibidos && !errorRecibidos && recibidos.length === 0 && (
                            <p className="state-msg">Non recibiches ningún convite.</p>
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
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        className="btn btn--ghost btn--sm"
                                                        onClick={() => handleRexeitar(c.token)}
                                                    >
                                                        Rexeitar
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
