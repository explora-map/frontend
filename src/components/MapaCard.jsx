// MapaCard.jsx
// Displays a summary card for a single map.
// If the current user is the owner, shows visibility toggle and delete icon.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cambiarVisibilidade, eliminarMapa } from '../services/mapaApi';

export default function MapaCard({ mapa, currentUsername, onDeleted, onVisibilityChanged }) {
    const navigate = useNavigate();
    const isOwner = mapa.creadoPor === currentUsername;
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function handleCardClick() {
        navigate(`/mapas/${mapa.id}`);
    }

    async function handleToggleVisibility(e) {
        e.stopPropagation();
        setToggling(true);
        try {
            const novoTipo = mapa.tipo === 'PUBLICO' ? 'PRIVADO' : 'PUBLICO';
            const updated = await cambiarVisibilidade(mapa.id, novoTipo);
            onVisibilityChanged?.(updated);
        } catch {
            // Silently ignore — page-level error handling not needed for a card toggle
        } finally {
            setToggling(false);
        }
    }

    async function handleDelete(e) {
        e.stopPropagation();
        if (!window.confirm(`Eliminar o mapa "${mapa.nome}"? Esta acción non se pode desfacer.`)) return;
        setDeleting(true);
        try {
            await eliminarMapa(mapa.id);
            onDeleted?.(mapa.id);
        } catch {
            alert('Non foi posible eliminar o mapa. Inténtao de novo.');
        } finally {
            setDeleting(false);
        }
    }

    const formattedDate = mapa.dataCreacion
        ? new Date(mapa.dataCreacion).toLocaleDateString()
        : '—';

    return (
        <div className="mapa-card" onClick={handleCardClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}>
            <div className="mapa-card__header">
                <h3 className="mapa-card__nome">{mapa.nome}</h3>
                <span className={`badge badge--tipo badge--${mapa.tipo === 'PUBLICO' ? 'publico' : 'privado'}`}>
                    {mapa.tipo === 'PUBLICO' ? 'Público' : 'Privado'}
                </span>
            </div>

            <p className="mapa-card__localizacion">{mapa.nomeLocalizacion}</p>
            <p className="mapa-card__date">{formattedDate}</p>

            {isOwner && (
                <div className="mapa-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="mapa-card__btn mapa-card__btn--toggle"
                        onClick={handleToggleVisibility}
                        disabled={toggling}
                        title={mapa.tipo === 'PUBLICO' ? 'Cambiar a privado' : 'Cambiar a público'}
                    >
                        {toggling ? '…' : mapa.tipo === 'PUBLICO' ? '🔓 Público' : '🔒 Privado'}
                    </button>
                    <button
                        className="mapa-card__btn mapa-card__btn--delete"
                        onClick={handleDelete}
                        disabled={deleting}
                        title="Eliminar mapa"
                        aria-label={`Eliminar ${mapa.nome}`}
                    >
                        {deleting ? '…' : '✕'}
                    </button>
                </div>
            )}
        </div>
    );
}
