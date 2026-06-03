// Notificacions.jsx
// Botón de campá con panel de notificacións derivadas de convites pendentes.
// Fai polling cada 60 segundos cando o usuario está autenticado.

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import useNotificacionStore, { TIPO_NOTIFICACION } from '../store/useNotificacionStore';
import { obterConvitesRecibidos, aceptarConvite, rexeitarConvite } from '../services/conviteApi';

/* ---- Iconas SVG ---- */

const BellIcon = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const EnvelopeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

/* ---- Subcompoñente: item individual ---- */

function NotificacionItem({ notificacion }) {
    const { t } = useTranslation();
    const [accionando, setAccionando] = useState(false);
    const [erroAccion, setErroAccion] = useState('');
    const marcarLida          = useNotificacionStore((s) => s.marcarLida);
    const eliminarNotificacion = useNotificacionStore((s) => s.eliminarNotificacion);

    const dataFormateada = notificacion.data
        ? new Date(notificacion.data).toLocaleDateString('gl-ES')
        : '';

    async function handleAceptar() {
        setAccionando(true);
        setErroAccion('');
        try {
            await aceptarConvite(notificacion.payload.token);
            marcarLida(notificacion.id);
            eliminarNotificacion(notificacion.id);
        } catch {
            setErroAccion(t('erros.xenerico'));
            setAccionando(false);
        }
    }

    async function handleRexeitar() {
        setAccionando(true);
        setErroAccion('');
        try {
            await rexeitarConvite(notificacion.payload.token);
            marcarLida(notificacion.id);
            eliminarNotificacion(notificacion.id);
        } catch {
            setErroAccion(t('erros.xenerico'));
            setAccionando(false);
        }
    }

    return (
        <li className={`notificacion-item ${notificacion.lida ? 'notificacion-item--lida' : ''}`}>
            <div className="notificacion-item__icona" aria-hidden="true">
                <EnvelopeIcon />
            </div>
            <div className="notificacion-item__corpo">
                <p className="notificacion-item__titulo">{notificacion.titulo}</p>
                <p className="notificacion-item__mensaxe">{notificacion.mensaxe}</p>
                <p className="notificacion-item__data">{dataFormateada}</p>
                {notificacion.tipo === TIPO_NOTIFICACION.CONVITE_RECIBIDO && !notificacion.lida && (
                    <div className="notificacion-item__accions">
                        <button
                            className="btn btn--primary btn--sm"
                            onClick={handleAceptar}
                            disabled={accionando}
                        >
                            {t('convites.botonAceptar')}
                        </button>
                        <button
                            className="btn btn--ghost btn--sm"
                            onClick={handleRexeitar}
                            disabled={accionando}
                        >
                            {t('convites.botonRexeitar')}
                        </button>
                        {erroAccion && (
                            <p className="notificacion-item__erro">
                                {erroAccion}
                            </p>
                        )}
                    </div>
                )}
            </div>
            {!notificacion.lida && <span className="notificacion-item__punto-azul" aria-hidden="true" />}
        </li>
    );
}

/* ---- Compoñente principal ---- */

export default function Notificacions() {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const btnRef     = useRef(null);
    const wrapperRef = useRef(null);
    const panelRef   = useRef(null);

    const [panelAberto, setPanelAberto] = useState(false);
    const [panelPos,    setPanelPos]    = useState({ top: 0, right: 0 });

    const notificacions    = useNotificacionStore((s) => s.notificacions);
    const setNotificacions  = useNotificacionStore((s) => s.setNotificacions);
    const marcarTodasLidas  = useNotificacionStore((s) => s.marcarTodasLidas);
    const totalNonLidas     = notificacions.filter((n) => !n.lida).length;

    // Carga inicial e polling cada 60 s
    useEffect(() => {
        if (!isAuthenticated) return;

        async function cargar() {
            try {
                const convites  = await obterConvitesRecibidos();
                const pendentes = convites.filter((c) => c.estado === 'PENDENTE');
                const lista     = pendentes.map((c) => ({
                    id:      `convite-${c.token}`,
                    tipo:    TIPO_NOTIFICACION.CONVITE_RECIBIDO,
                    titulo:  t('notificacions.conviteTitulo'),
                    mensaxe: t('notificacions.conviteMensaxe', { remitente: c.usernameAnfitrioa, mapa: c.mapaNome }),
                    lida:    false,
                    data:    c.dataCreacion ?? null,
                    payload: { token: c.token, mapaId: c.mapaId, remitente: c.usernameAnfitrioa },
                }));
                setNotificacions(lista);
            } catch {
                // silently ignore — panel simply stays empty
            }
        }

        cargar();
        const interval = setInterval(cargar, 60_000);
        return () => clearInterval(interval);
    }, [isAuthenticated, t]); // eslint-disable-line react-hooks/exhaustive-deps

    // Pechar ao clicar fóra
    useEffect(() => {
        if (!panelAberto) return;
        function onMouseDown(e) {
            const inWrapper = wrapperRef.current?.contains(e.target);
            const inPanel   = panelRef.current?.contains(e.target);
            if (!inWrapper && !inPanel) setPanelAberto(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        return () => document.removeEventListener('mousedown', onMouseDown);
    }, [panelAberto]);

    // Pechar con Escape
    useEffect(() => {
        if (!panelAberto) return;
        function onKeyDown(e) {
            if (e.key === 'Escape') setPanelAberto(false);
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [panelAberto]);

    function handleToggle() {
        if (!panelAberto && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPanelPos({
                top:   rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
        setPanelAberto((prev) => !prev);
    }

    return (
        <div className="notificacions-wrapper" ref={wrapperRef}>
            <button
                ref={btnRef}
                className="notificacions__btn"
                onClick={handleToggle}
                aria-label={`${t('notificacions.titulo')}${totalNonLidas > 0 ? `, ${totalNonLidas} sen ler` : ''}`}
            >
                <BellIcon />
                {totalNonLidas > 0 && (
                    <span className="notificacions__badge" aria-hidden="true">
                        {totalNonLidas > 9 ? '9+' : totalNonLidas}
                    </span>
                )}
            </button>

            {panelAberto && ReactDOM.createPortal(
                <div
                    ref={panelRef}
                    className="notificacions-panel"
                    role="dialog"
                    aria-label={t('notificacions.titulo')}
                    aria-modal="false"
                    style={{ top: panelPos.top, right: panelPos.right }}
                >
                    <div className="notificacions-panel__header">
                        <h2 className="notificacions-panel__titulo">{t('notificacions.titulo')}</h2>
                        {totalNonLidas > 0 && (
                            <button className="btn btn--ghost btn--sm" onClick={marcarTodasLidas}>
                                {t('notificacions.marcarTodasLidas')}
                            </button>
                        )}
                    </div>
                    <div className="notificacions-panel__corpo">
                        {notificacions.length === 0 ? (
                            <p className="notificacions-panel__baleiro">{t('notificacions.baleiro')}</p>
                        ) : (
                            <ul className="notificacions-panel__lista">
                                {notificacions.map((n) => (
                                    <NotificacionItem key={n.id} notificacion={n} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}
