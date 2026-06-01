import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import usePasswordStrength from '../hooks/usePasswordStrength';
import ConfirmDialog from '../components/ConfirmDialog';
import { obterPerfil, actualizarPerfil, eliminarConta } from '../services/perfilApi';
import { obterConvitesRecibidos, aceptarConvite, rexeitarConvite } from '../services/conviteApi';

export default function PerfilPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Profile form state
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    correo: '',
    password: '',
  });
  const [cargando, setCargando] = useState(true);
  const [gardando, setGardando] = useState(false);
  const [gardado, setGardado] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // Invitations state
  const [convites, setConvites] = useState([]);
  const [cargandoConvites, setCargandoConvites] = useState(true);

  // Delete account dialog
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [erroEliminar, setErroEliminar] = useState('');

  // Password strength
  const passwordStrength = usePasswordStrength(formData.password ?? '', {
    weak: t('contrasinal.debil'),
    moderate: t('contrasinal.moderado'),
    strong: t('contrasinal.forte'),
  });

  // Load profile on mount
  useEffect(() => {
    async function cargarPerfil() {
      try {
        const datos = await obterPerfil();
        setFormData({
          nome: datos.nome ?? '',
          username: datos.username ?? '',
          correo: datos.correo ?? '',
          password: '',
        });
      } catch {
        setErroForm(t('erros.xenerico'));
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load pending invitations on mount
  useEffect(() => {
    async function cargarConvites() {
      try {
        const todos = await obterConvitesRecibidos();
        setConvites(todos.filter(c => c.estado === 'PENDENTE'));
      } catch {
        // Silently fail
      } finally {
        setCargandoConvites(false);
      }
    }
    cargarConvites();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErroForm('');
    setGardado(false);
  }

  async function handleGardar(e) {
    e.preventDefault();
    setGardando(true);
    setErroForm('');
    setGardado(false);

    // Only send non-empty fields
    const payload = {};
    if (formData.nome.trim()) payload.nome = formData.nome.trim();
    if (formData.username.trim()) payload.username = formData.username.trim();
    if (formData.correo.trim()) payload.correo = formData.correo.trim();
    if (formData.password.trim()) payload.password = formData.password.trim();

    try {
      await actualizarPerfil(payload);
      setGardado(true);
      setFormData(prev => ({ ...prev, password: '' }));
      setTimeout(() => setGardado(false), 3000);
    } catch (err) {
      setErroForm(err.response?.data?.message || t('erros.xenerico'));
    } finally {
      setGardando(false);
    }
  }

  async function handleAceptarConvite(token) {
    try {
      await aceptarConvite(token);
      setConvites(prev => prev.filter(c => c.token !== token));
    } catch {
      // Silently fail
    }
  }

  async function handleRexeitarConvite(token) {
    try {
      await rexeitarConvite(token);
      setConvites(prev => prev.filter(c => c.token !== token));
    } catch {
      // Silently fail
    }
  }

  async function handleEliminarConta() {
    if (eliminando) return;
    setEliminando(true);
    setErroEliminar('');
    try {
      await eliminarConta();
      logout();
      navigate('/login');
    } catch (err) {
      setErroEliminar(err.response?.data?.message || t('erros.xenerico'));
      setConfirmEliminarOpen(false);
      setEliminando(false);
    }
  }

  if (cargando) {
    return (
      <div className="perfil-page">
        <div className="perfil-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-item" style={{ height: '56px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <h1 className="perfil-page__titulo">{t('perfil.titulo')}</h1>

      {/* Avatar */}
      <div className="perfil-avatar-wrapper">
        <div className="perfil-avatar" aria-hidden="true">
          <span className="perfil-avatar__inicial">
            {formData.username?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div className="perfil-avatar__info">
          <p className="perfil-avatar__username">@{formData.username}</p>
          <p className="perfil-avatar__correo">{formData.correo}</p>
        </div>
        <div className="perfil-avatar__accions">
          <button
            className="btn btn--ghost btn--icon-sm"
            onClick={() => navigate('/configuracion')}
            title={t('nav.configuracion')}
            aria-label={t('nav.configuracion')}
            type="button"
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={18} height={18}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button
            className="btn btn--ghost btn--icon-sm perfil-avatar__logout"
            onClick={logout}
            title={t('nav.pecharSesion')}
            aria-label={t('nav.pecharSesion')}
            type="button"
          >
            <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2} width={18} height={18}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Profile form */}
      <section className="perfil-section" aria-labelledby="perfil-datos-titulo">
        <h2 id="perfil-datos-titulo" className="perfil-section__titulo">
          {t('perfil.datosPersoais')}
        </h2>
        <form className="perfil-form" onSubmit={handleGardar} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="perfil-nome">
              {t('perfil.campoNome')}
            </label>
            <input
              id="perfil-nome"
              name="nome"
              type="text"
              className="form-input"
              value={formData.nome}
              onChange={handleChange}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="perfil-username">
              {t('perfil.campoUsuaria')}
            </label>
            <input
              id="perfil-username"
              name="username"
              type="text"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="perfil-correo">
              {t('perfil.campoCorreo')}
            </label>
            <input
              id="perfil-correo"
              name="correo"
              type="email"
              className="form-input"
              value={formData.correo}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="perfil-password">
              {t('perfil.campoClave')}
            </label>
            <input
              id="perfil-password"
              name="password"
              type="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('perfil.placeholderClave')}
              autoComplete="new-password"
            />
            {passwordStrength.visible && (
              <div className="password-strength" aria-live="polite" aria-atomic="true">
                <div className="password-strength__bar-track">
                  <div
                    className="password-strength__bar-fill"
                    style={{
                      width: `${passwordStrength.pct}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span
                  className="password-strength__label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {erroForm && (
            <p className="config-feedback config-feedback--erro" role="alert">
              {erroForm}
            </p>
          )}

          {gardado && (
            <p className="config-feedback config-feedback--ok" role="status" aria-live="polite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t('perfil.gardado')}
            </p>
          )}

          <div className="perfil-form__accions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={gardando}
            >
              {gardando ? t('cargando.gardando') : t('perfil.botonGardar')}
            </button>
          </div>
        </form>
      </section>

      {/* Pending invitations */}
      <section className="perfil-section" aria-labelledby="perfil-convites-titulo">
        <h2 id="perfil-convites-titulo" className="perfil-section__titulo">
          {t('convites.recibidos')}
        </h2>
        {cargandoConvites ? (
          <div className="skeleton-item" style={{ height: '60px', borderRadius: 'var(--radius-md)' }} />
        ) : convites.length === 0 ? (
          <p className="perfil-baleiro">{t('convites.sinConvites')}</p>
        ) : (
          <ul className="perfil-convites">
            {convites.map(c => (
              <li key={c.token} className="perfil-convite-item">
                <div className="perfil-convite-item__info">
                  <p className="perfil-convite-item__texto">
                    <strong>{c.usernameAnfitrioa}</strong> {t('perfil.convidouteAoMapa')} <strong>{c.mapaNome}</strong>
                  </p>
                  <p className="perfil-convite-item__data">
                    {new Date(c.dataCreacion).toLocaleDateString('gl-ES')}
                  </p>
                </div>
                <div className="perfil-convite-item__accions">
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleAceptarConvite(c.token)}
                  >
                    {t('convites.botonAceptar')}
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleRexeitarConvite(c.token)}
                  >
                    {t('convites.botonRexeitar')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger zone */}
      <section className="perfil-section perfil-section--danger" aria-labelledby="perfil-danger-titulo">
        <h2 id="perfil-danger-titulo" className="perfil-section__titulo perfil-section__titulo--danger">
          {t('perfil.zonaPerigo')}
        </h2>
        <div className="perfil-danger-corpo">
          <div className="perfil-danger-info">
            <p className="perfil-danger-titulo">{t('perfil.botonEliminarConta')}</p>
            <p className="perfil-danger-descricion">{t('perfil.confirmEliminarMensaxe')}</p>
          </div>
          <button
            className="btn btn--danger btn--sm"
            onClick={() => { setErroEliminar(''); setConfirmEliminarOpen(true); }}
          >
            {t('perfil.botonEliminarConta')}
          </button>
        </div>
        {erroEliminar && (
          <p className="config-feedback config-feedback--erro" role="alert">
            {erroEliminar}
          </p>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmEliminarOpen}
        title={t('perfil.confirmEliminarTitulo')}
        message={t('perfil.confirmEliminarMensaxe')}
        confirmLabel={eliminando ? t('cargando.eliminando') : t('perfil.confirmEliminarBoton')}
        variant="danger"
        onConfirm={handleEliminarConta}
        onCancel={() => !eliminando && setConfirmEliminarOpen(false)}
      />

    </div>
  );
}
