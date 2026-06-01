import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import useIdiomaStore from '../store/useIdiomaStore';
import useTemaStore from '../store/useTemaStore';
import { actualizarPerfil } from '../services/perfilApi';

export default function ConfiguracionPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { idioma, setIdioma } = useIdiomaStore();
  const { tema, setTema } = useTemaStore();
  const [gardado, setGardado] = useState(false);
  const [erro, setErro] = useState('');

  async function handleCambioIdioma(novo) {
    setErro('');
    setGardado(false);
    await setIdioma(novo, isAuthenticated, isAuthenticated ? actualizarPerfil : null);
    setGardado(true);
    setTimeout(() => setGardado(false), 3000);
  }

  return (
    <div className="config-page">
      <h1 className="config-page__titulo">{t('configuracion.titulo')}</h1>

      <section className="config-section" aria-labelledby="config-idioma-titulo">
        <h2 id="config-idioma-titulo" className="config-section__titulo">
          {t('configuracion.idioma')}
        </h2>
        <div className="config-section__corpo">
          <div className="idioma-selector" role="radiogroup" aria-label={t('configuracion.idioma')}>
            <button
              className={`idioma-option ${idioma === 'gl' ? 'idioma-option--activo' : ''}`}
              onClick={() => handleCambioIdioma('gl')}
              role="radio"
              aria-checked={idioma === 'gl'}
            >
              <span className="idioma-option__nome">Galego</span>
              {idioma === 'gl' && (
                <span className="idioma-option__check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
            <button
              className={`idioma-option ${idioma === 'en' ? 'idioma-option--activo' : ''}`}
              onClick={() => handleCambioIdioma('en')}
              role="radio"
              aria-checked={idioma === 'en'}
            >
              <span className="idioma-option__nome">English</span>
              {idioma === 'en' && (
                <span className="idioma-option__check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          </div>

          {gardado && (
            <p className="config-feedback config-feedback--ok" role="status" aria-live="polite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t('configuracion.gardado')}
            </p>
          )}
          {erro && (
            <p className="config-feedback config-feedback--erro" role="alert">
              {erro}
            </p>
          )}
        </div>
      </section>

      <section className="config-section" aria-labelledby="config-tema-titulo">
        <h2 id="config-tema-titulo" className="config-section__titulo">
          {t('configuracion.tema')}
        </h2>
        <div className="config-section__corpo">
          <div className="tema-selector" role="radiogroup" aria-label={t('configuracion.tema')}>
            <button
              className={`tema-option${tema === 'light' ? ' tema-option--activo' : ''}`}
              role="radio"
              aria-checked={tema === 'light'}
              onClick={() => setTema('light')}
            >
              <span className="tema-option__icona" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </span>
              <span className="tema-option__nome">{t('configuracion.temaClaro')}</span>
            </button>
            <button
              className={`tema-option${tema === 'dark' ? ' tema-option--activo' : ''}`}
              role="radio"
              aria-checked={tema === 'dark'}
              onClick={() => setTema('dark')}
            >
              <span className="tema-option__icona" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </span>
              <span className="tema-option__nome">{t('configuracion.temaEscuro')}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
