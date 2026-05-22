// ConvitePanel.jsx
// Shown on MapaDetallePage for map owners only.
// Lets the owner invite a user and lists all invitations sent for this map.

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { enviarConvite, obterConvitesEnviados, cancelarConvite } from '../services/conviteApi';

const ROLES_PRIVADO = ['MEMBRO', 'COLABORADORA', 'ADMIN_MAPA'];
const ROLES_PUBLICO = ['COLABORADORA', 'ADMIN_MAPA'];


export default function ConvitePanel({ mapaId, tipoMapa }) {
    const { t } = useTranslation();
    const roles = tipoMapa === 'PUBLICO' ? ROLES_PUBLICO : ROLES_PRIVADO;

    const ESTADO_LABEL = {
        PENDENTE:  t('convites.estadoPendente'),
        ACEPTADO:  t('convites.estadoAceptado'),
        REXEITADO: t('convites.estadoRexeitado'),
        CANCELADO: t('convites.estadoCancelado'),
        EXPIRADO:  t('convites.estadoExpirado'),
    };
    const [username, setUsername] = useState('');
    const [rolConvite, setRolConvite] = useState(
        tipoMapa === 'PUBLICO' ? 'COLABORADORA' : 'MEMBRO'
    );
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
            setFetchError(t('erros.xenerico'));
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
            await enviarConvite(mapaId, trimmed, rolConvite);
            // TODO: add convites.conviteEnviado (with {{username}} interpolation) to translation files
            setSendSuccess(`Convite enviado a ${trimmed}.`);
            setUsername('');
            await loadConvites();
        } catch (err) {
            setSendError(
                err.response?.data?.message || t('erros.xenerico'),
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
            // silently ignore — the invite remains visible if the request fails
        }
    }

    return (
        <div className="convite-panel">
            <h3 className="convite-panel__title">{t('convites.titulo')}</h3>

            <form className="convite-panel__form" onSubmit={handleSend}>
                {/* TODO: add convites.ariaConvidar to translation files */}
                <input
                    className="convite-panel__input"
                    type="text"
                    placeholder={t('convites.campoUsuaria')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={sending}
                    aria-label="Nome de usuaria a convidar"
                />
                <select
                    className="convite-panel__rol-select"
                    value={rolConvite}
                    onChange={(e) => setRolConvite(e.target.value)}
                    disabled={sending}
                    aria-label="Rol do convite"
                >
                    {roles.map((r) => (
                        <option key={r} value={r}>{t('roles.' + r, { defaultValue: r })}</option>
                    ))}
                </select>
                <button
                    className="convite-panel__send-btn"
                    type="submit"
                    disabled={sending || !username.trim()}
                >
                    {sending ? t('cargando.xenerico') : t('convites.botonConvidar')}
                </button>
            </form>

            {sendError && <p className="convite-panel__msg convite-panel__msg--error">{sendError}</p>}
            {sendSuccess && <p className="convite-panel__msg convite-panel__msg--success">{sendSuccess}</p>}

            <h4 className="convite-panel__subtitle">{t('convites.enviados')}</h4>

            {loading && <p className="convite-panel__state">{t('cargando.xenerico')}</p>}
            {fetchError && <p className="convite-panel__msg convite-panel__msg--error">{fetchError}</p>}

            {/* TODO: add convites.sinConvitesMapa to translation files */}
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
                                    {t('convites.botonCancelar')}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
