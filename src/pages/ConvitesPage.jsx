// ConvitesPage.jsx
// Protected page at /convites.
// Two tabs: sent invitations (Enviados) and received invitations (Recibidos).

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    obterConvitesEnviados,
    obterConvitesRecibidos,
    cancelarConvite,
    aceptarConvite,
    rexeitarConvite,
} from '../services/conviteApi';
import '../assets/styles/mapas.css';

export default function ConvitesPage() {
    const { t } = useTranslation();

    const ESTADO_LABEL = {
        PENDENTE:  t('convites.estadoPendente'),
        ACEPTADO:  t('convites.estadoAceptado'),
        REXEITADO: t('convites.estadoRexeitado'),
        CANCELADO: t('convites.estadoCancelado'),
        EXPIRADO:  t('convites.estadoExpirado'),
    };

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
            setErrorEnviados(t('convites.errorCargarEnviados'));
        } finally {
            setLoadingEnviados(false);
        }
    }, [t]);

    const loadRecibidos = useCallback(async () => {
        setLoadingRecibidos(true);
        setErrorRecibidos('');
        try {
            setRecibidos(await obterConvitesRecibidos());
        } catch {
            setErrorRecibidos(t('convites.errorCargarRecibidos'));
        } finally {
            setLoadingRecibidos(false);
        }
    }, [t]);

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
            <main className="page__main">
                <h1 className="page__title">{t('convites.titulo')}</h1>

                {/* Tabs */}
                <div className="tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'enviados'}
                        className={`tab${activeTab === 'enviados' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('enviados')}
                    >
                        {t('convites.tabEnviados')}
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'recibidos'}
                        className={`tab${activeTab === 'recibidos' ? ' tab--active' : ''}`}
                        onClick={() => setActiveTab('recibidos')}
                    >
                        {t('convites.tabRecibidos')}
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
                        {loadingEnviados && <p className="state-msg">{t('convites.cargando')}</p>}
                        {errorEnviados && <p className="state-msg state-msg--error">{errorEnviados}</p>}
                        {!loadingEnviados && !errorEnviados && enviados.length === 0 && (
                            <p className="state-msg">{t('convites.sinConvitesEnviados')}</p>
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
                                                    {t('convites.botonCancelar')}
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
                        {loadingRecibidos && <p className="state-msg">{t('convites.cargando')}</p>}
                        {errorRecibidos && <p className="state-msg state-msg--error">{errorRecibidos}</p>}
                        {!loadingRecibidos && !errorRecibidos && recibidos.length === 0 && (
                            <p className="state-msg">{t('convites.sinConvitesRecibidos')}</p>
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
                                                        {t('convites.botonAceptar')}
                                                    </button>
                                                    <button
                                                        className="btn btn--ghost btn--sm"
                                                        onClick={() => handleRexeitar(c.token)}
                                                    >
                                                        {t('convites.botonRexeitar')}
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
