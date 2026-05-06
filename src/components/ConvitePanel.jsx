// ConvitePanel.jsx
// Shown on MapaDetallePage for map owners only.
// Lets the owner invite a user and lists all invitations sent for this map.

import React, { useState, useEffect, useCallback } from 'react';
import { enviarConvite, obterConvitesEnviados, cancelarConvite } from '../services/conviteApi';

const ESTADO_LABEL = {
    PENDENTE: 'Pendente',
    ACEPTADO: 'Aceptado',
    REXEITADO: 'Rexeitado',
    CANCELADO: 'Cancelado',
    EXPIRADO: 'Expirado',
};

export default function ConvitePanel({ mapaId }) {
    const [username, setUsername] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const [sendSuccess, setSendSuccess] = useState('');

    const [convites, setConvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const loadConvites = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const all = await obterConvitesEnviados();
            setConvites(all.filter((c) => c.mapaId === mapaId));
        } catch {
            setFetchError('Non foi posible cargar os convites.');
        } finally {
            setLoading(false);
        }
    }, [mapaId]);

    useEffect(() => {
        loadConvites();
    }, [loadConvites]);

    async function handleSend(e) {
        e.preventDefault();
        const trimmed = username.trim();
        if (!trimmed) return;

        setSending(true);
        setSendError('');
        setSendSuccess('');
        try {
            await enviarConvite(mapaId, trimmed);
            setSendSuccess(`Convite enviado a ${trimmed}.`);
            setUsername('');
            await loadConvites();
        } catch (err) {
            setSendError(
                err.response?.data?.message || 'Non foi posible enviar o convite.',
            );
        } finally {
            setSending(false);
        }
    }

    async function handleCancel(token) {
        try {
            await cancelarConvite(token);
            setConvites((prev) => prev.filter((c) => c.token !== token));
        } catch {
            alert('Non foi posible cancelar o convite.');
        }
    }

    return (
        <div className="convite-panel">
            <h3 className="convite-panel__title">Convidar usuario</h3>

            <form className="convite-panel__form" onSubmit={handleSend}>
                <input
                    className="convite-panel__input"
                    type="text"
                    placeholder="Nome de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={sending}
                    aria-label="Nome de usuario a convidar"
                />
                <button
                    className="convite-panel__send-btn"
                    type="submit"
                    disabled={sending || !username.trim()}
                >
                    {sending ? 'Enviando…' : 'Enviar'}
                </button>
            </form>

            {sendError && <p className="convite-panel__msg convite-panel__msg--error">{sendError}</p>}
            {sendSuccess && <p className="convite-panel__msg convite-panel__msg--success">{sendSuccess}</p>}

            <h4 className="convite-panel__subtitle">Convites enviados</h4>

            {loading && <p className="convite-panel__state">Cargando…</p>}
            {fetchError && <p className="convite-panel__msg convite-panel__msg--error">{fetchError}</p>}

            {!loading && !fetchError && convites.length === 0 && (
                <p className="convite-panel__state">Non hai convites enviados para este mapa.</p>
            )}

            {!loading && convites.length > 0 && (
                <ul className="convite-panel__list">
                    {convites.map((c) => (
                        <li key={c.token} className="convite-panel__item">
                            <span className="convite-panel__user">{c.usernameConvidada}</span>
                            <span className={`badge badge--estado badge--${c.estado.toLowerCase()}`}>
                                {ESTADO_LABEL[c.estado] ?? c.estado}
                            </span>
                            {c.estado === 'PENDENTE' && (
                                <button
                                    className="convite-panel__cancel-btn"
                                    onClick={() => handleCancel(c.token)}
                                    title="Cancelar convite"
                                >
                                    Cancelar
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
