import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import { cambiarVisibilidade, eliminarMapa } from '../services/mapaApi';

const textoRol = {
  'PROPIETARIA':  'Propietaria',
  'ADMIN_MAPA':   'Administradora',
  'COLABORADORA': 'Colaboradora',
  'MEMBRO':       'Membro',
};

export default function MapaCard({ mapa, onEliminar, onVisibilidadeCambiada, accionExtra, rolEfectivo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [erro, setErro] = useState('');
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const kebabRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuAberto) return;
    function handleMouseDown(e) {
      if (kebabRef.current && !kebabRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [menuAberto]);

  // Close menu on Escape
  useEffect(() => {
    if (!menuAberto) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMenuAberto(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuAberto]);

  function handleKebabClick(e) {
    e.stopPropagation();
    if (!menuAberto && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setMenuAberto(prev => !prev);
  }

  function handleEditar(e) {
    e.stopPropagation();
    setMenuAberto(false);
    navigate(`/mapas/${mapa.id}/editar`);
  }

  async function handleCambiarVisibilidade(e) {
    e.stopPropagation();
    setMenuAberto(false);
    const novoTipo = mapa.tipo === 'PUBLICO' ? 'PRIVADO' : 'PUBLICO';
    try {
      const actualizado = await cambiarVisibilidade(mapa.id, novoTipo);
      if (onVisibilidadeCambiada) onVisibilidadeCambiada(actualizado);
    } catch (err) {
      setErro(err.response?.data?.message || t('erros.xenerico'));
    }
  }

  function handleDescargar(e) {
    e.stopPropagation();
    setMenuAberto(false);
    const blob = new Blob([JSON.stringify({ mapa, marcadores: [] }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mapa.nome}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEliminarClick(e) {
    e.stopPropagation();
    setMenuAberto(false);
    setConfirmOpen(true);
  }

  async function handleEliminarConfirm() {
    try {
      await eliminarMapa(mapa.id);
      setConfirmOpen(false);
      if (onEliminar) onEliminar(mapa.id);
    } catch (err) {
      setConfirmOpen(false);
      setErro(err.response?.data?.message || t('erros.xenerico'));
    }
  }

  return (
    <article className="mapa-card">
      <div className="mapa-card__header">
        <span className={`badge badge--${mapa.tipo === 'PUBLICO' ? 'publico' : 'privado'}`}>
          {mapa.tipo === 'PUBLICO' ? t('mapas.etiquetaPublico') : t('mapas.etiquetaPrivado')}
        </span>
        {rolEfectivo && textoRol[rolEfectivo] && (
          <span className={`badge badge--${['PROPIETARIA', 'ADMIN_MAPA'].includes(rolEfectivo) ? 'publico' : 'privado'}`}>
            {textoRol[rolEfectivo]}
          </span>
        )}

        <div className="mapa-card__kebab-wrapper">
          <button
            ref={btnRef}
            className="btn btn--icon btn--ghost mapa-card__kebab-trigger"
            onClick={handleKebabClick}
            aria-label="Opcións do mapa"
            aria-haspopup="true"
            aria-expanded={menuAberto}
          >
            <span className="kebab-dots" aria-hidden="true">
              <span className="kebab-dot" />
              <span className="kebab-dot" />
              <span className="kebab-dot" />
            </span>
          </button>
        </div>
      </div>

      <div className="mapa-card__body" onClick={() => navigate(`/mapas/${mapa.id}`)}>
        <h3 className="mapa-card__nome">{mapa.nome}</h3>
        {mapa.descricion && (
          <p className="mapa-card__descricion">{mapa.descricion}</p>
        )}
        {mapa.nomeLocalizacion && (
          <p className="mapa-card__localizacion">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {mapa.nomeLocalizacion}
          </p>
        )}
        {erro && <p className="form-error mapa-card__footer--offset">{erro}</p>}
      </div>

      {accionExtra && (
        <div className="mapa-card__footer">
          {accionExtra}
        </div>
      )}

      {menuAberto && ReactDOM.createPortal(
        <ul
          ref={kebabRef}
          role="menu"
          style={{
            position: 'fixed',
            top: menuPos.top,
            right: menuPos.right,
            backgroundColor: 'var(--color-surface)',
            border: 'var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '180px',
            zIndex: 'var(--z-tooltip)',
            padding: '4px',
            listStyle: 'none',
            animation: 'menu-in 150ms ease-out',
          }}
        >
          <li role="menuitem">
            <button className="mapa-card__kebab-item" onClick={handleEditar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t('mapas.botonEditar')}
            </button>
          </li>
          <li role="menuitem">
            <button className="mapa-card__kebab-item" onClick={handleCambiarVisibilidade}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {t('mapas.botonCambiarVisibilidade')}
            </button>
          </li>
          <li role="menuitem">
            <button className="mapa-card__kebab-item" onClick={handleDescargar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {t('mapas.botonDescargar')}
            </button>
          </li>
          <li role="menuitem">
            <button className="mapa-card__kebab-item mapa-card__kebab-item--danger" onClick={handleEliminarClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              {t('mapas.botonEliminar')}
            </button>
          </li>
        </ul>,
        document.body
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={t('mapas.confirmEliminarTitulo')}
        message={t('mapas.confirmEliminarMensaxe')}
        confirmLabel={t('mapas.confirmEliminarBoton')}
        variant="danger"
        onConfirm={handleEliminarConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
}
