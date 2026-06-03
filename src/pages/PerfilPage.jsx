import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import usePasswordStrength from '../hooks/usePasswordStrength';
import ConfirmDialog from '../components/ConfirmDialog';
import { obterPerfil, actualizarPerfil, eliminarConta } from '../services/perfilApi';
import { obterConvitesRecibidos, aceptarConvite, rexeitarConvite } from '../services/conviteApi';
import { SettingsIcon, LogoutIcon } from '../components/Iconas';

export default function PerfilPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Profile form state
  const [formData, setFormData] = useState({
    nome: '',
    username: '',
    correo: '',
    contrasinelActual: '',
    contrasinelNovo: '',
    contrasinelNovoConfirmacion: '',
  });
  const [erros, setErros] = useState({});
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
  const passwordStrength = usePasswordStrength(formData.contrasinelNovo ?? '', {
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
          contrasinelActual: '',
          contrasinelNovo: '',
          contrasinelNovoConfirmacion: '',
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
    setErros(prev => ({ ...prev, [name]: undefined }));
    setErroForm('');
    setGardado(false);
  }

  function validate(fields) {
    const erros = {};
    const quereChangar = fields.contrasinelNovo.trim() !== '';
    if (quereChangar) {
      if (!fields.contrasinelActual.trim()) {
        erros.contrasinelActual = t('perfil.erros.contrasinelActualObrigatorio');
      }
      if (fields.contrasinelNovo.length < 8) {
        erros.contrasinelNovo = t('perfil.erros.contrasinelCurto');
      }
      if (fields.contrasinelNovo === fields.contrasinelActual) {
        erros.contrasinelNovo = t('perfil.erros.contrasinelIgualAoActual');
      }
      if (fields.contrasinelNovo !== fields.contrasinelNovoConfirmacion) {
        erros.contrasinelNovoConfirmacion = t('perfil.erros.contrasinelNonCoinicide');
      }
    }
    return erros;
  }

  async function handleGardar(e) {
    e.preventDefault();

    const validErros = validate(formData);
    if (Object.keys(validErros).length > 0) {
      setErros(validErros);
      return;
    }

    setGardando(true);
    setErroForm('');
    setErros({});
    setGardado(false);

    try {
      await actualizarPerfil(formData);
      setGardado(true);
      setFormData(prev => ({
        ...prev,
        contrasinelActual: '',
        contrasinelNovo: '',
        contrasinelNovoConfirmacion: '',
      }));
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
            <SettingsIcon size={18} />
          </button>
          <button
            className="btn btn--ghost btn--icon-sm perfil-avatar__logout"
            onClick={logout}
            title={t('nav.pecharSesion')}
            aria-label={t('nav.pecharSesion')}
            type="button"
          >
            <LogoutIcon size={18} />
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
            <label className="form-label" htmlFor="perfil-contrasinelActual">
              {t('perfil.contrasinelActual')}
            </label>
            <input
              id="perfil-contrasinelActual"
              name="contrasinelActual"
              type="password"
              className="form-input"
              value={formData.contrasinelActual}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {erros.contrasinelActual && (
              <p className="form-error" role="alert">{erros.contrasinelActual}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="perfil-contrasinelNovo">
              {t('perfil.contrasinelNovo')}
            </label>
            <input
              id="perfil-contrasinelNovo"
              name="contrasinelNovo"
              type="password"
              className="form-input"
              value={formData.contrasinelNovo}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {passwordStrength.visible && (
              <div className="password-strength"
                   style={{ '--strength-pct': `${passwordStrength.pct}%`,
                            '--strength-color': passwordStrength.color }}
                   aria-live="polite" aria-atomic="true">
                <div className="password-strength__bar-track">
                  <div className="password-strength__bar-fill" />
                </div>
                <span className="password-strength__label">
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {erros.contrasinelNovo && (
              <p className="form-error" role="alert">{erros.contrasinelNovo}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="perfil-contrasinelNovoConfirmacion">
              {t('perfil.contrasinelNovoConfirmacion')}
            </label>
            <input
              id="perfil-contrasinelNovoConfirmacion"
              name="contrasinelNovoConfirmacion"
              type="password"
              className="form-input"
              value={formData.contrasinelNovoConfirmacion}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {erros.contrasinelNovoConfirmacion && (
              <p className="form-error" role="alert">{erros.contrasinelNovoConfirmacion}</p>
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
