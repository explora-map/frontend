// RegisterPage.jsx
//
// Validation mirrors the Spring Boot backend annotations exactly:
//   nome:     NotBlank, 3–20 chars
//   username: NotBlank, 4–20 chars
//   correo:   NotBlank, 8–50 chars, Email format
//   password: NotBlank, 8–40 chars
// plus client-side confirm-password check.
//
// We validate on submit AND on blur (after the field has been touched)
// to give immediate feedback without being annoying on first load.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { register } from '../services/authApi';
import FormInput from '../components/FormInput';
import AppLogo from '../components/AppLogo';
import usePasswordStrength from '../hooks/usePasswordStrength';
import '../assets/styles/auth.css';

function validate(fields, t) {
    const errors = {};

    if (!fields.nome.trim()) {
        errors.nome = t('auth.rexistro.validNomeObrigatorio');
    } else if (fields.nome.trim().length < 3) {
        errors.nome = t('auth.rexistro.validNomeCurto');
    } else if (fields.nome.trim().length > 20) {
        errors.nome = t('auth.rexistro.validNomeLongo');
    }

    if (!fields.username.trim()) {
        errors.username = t('auth.rexistro.validUsernameObrigatorio');
    } else if (fields.username.trim().length < 4) {
        errors.username = t('auth.rexistro.validUsernameCurto');
    } else if (fields.username.trim().length > 20) {
        errors.username = t('auth.rexistro.validUsernameLongo');
    }

    if (!fields.correo.trim()) {
        errors.correo = t('auth.rexistro.validCorreoObrigatorio');
    } else if (fields.correo.trim().length < 8) {
        errors.correo = t('auth.rexistro.validCorreoCurto');
    } else if (fields.correo.trim().length > 50) {
        errors.correo = t('auth.rexistro.validCorreoLongo');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.correo.trim())) {
        errors.correo = t('auth.rexistro.validCorreoFormato');
    }

    if (!fields.password) {
        errors.password = t('auth.rexistro.validClaveObrigatoria');
    } else if (fields.password.length < 8) {
        errors.password = t('auth.rexistro.validClaveCurta');
    } else if (fields.password.length > 40) {
        errors.password = t('auth.rexistro.validClaveLonga');
    }

    if (!fields.confirmPassword) {
        errors.confirmPassword = t('auth.rexistro.validConfirmarClaveObrigatoria');
    } else if (fields.password !== fields.confirmPassword) {
        errors.confirmPassword = t('auth.rexistro.validClavesNonCoiniciden');
    }

    return errors;
}

export default function RegisterPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [fields, setFields] = useState({
        nome: '',
        username: '',
        correo: '',
        password: '',
        confirmPassword: '',
    });

    // Track which fields have been blurred (touched) so we only show
    // validation errors after the user has interacted with a field.
    const [touched, setTouched] = useState({});
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rexistrado, setRexistrado] = useState(false);

    const passwordStrength = usePasswordStrength(fields.password ?? '', {
        weak: t('contrasinal.debil'),
        moderate: t('contrasinal.moderado'),
        strong: t('contrasinal.forte'),
    });

    const errors = validate(fields, t);
    // Only show an error if the field has been touched OR we've tried to submit
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const visibleErrors = Object.fromEntries(
        Object.entries(errors).filter(
            ([key]) => touched[key] || submitAttempted,
        ),
    );

    function handleChange(e) {
        const { id, value } = e.target;
        setFields((prev) => ({ ...prev, [id]: value }));
        // Clear server error when user starts correcting
        if (serverError) setServerError('');
    }

    function handleBlur(e) {
        setTouched((prev) => ({ ...prev, [e.target.id]: true }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitAttempted(true);

        // Client-side gate: don't submit if there are validation errors
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        setServerError('');

        try {
            await register({
                nome: fields.nome.trim(),
                username: fields.username.trim(),
                correo: fields.correo.trim(),
                password: fields.password,
            });

            // Registration succeeded → show email verification prompt
            setRexistrado(true);
        } catch (err) {
            // Parse backend 400 error messages.
            // The Spring Boot backend returns either a string or a structured body.
            const responseData = err.response?.data;

            if (err.response?.status === 400) {
                if (typeof responseData === 'string') {
                    setServerError(responseData);
                } else if (responseData?.message) {
                    setServerError(responseData.message);
                } else if (responseData?.error) {
                    setServerError(responseData.error);
                } else {
                    setServerError(t('auth.rexistro.errorDuplicado'));
                }
            } else {
                setServerError(t('auth.rexistro.errorXenerico'));
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (rexistrado) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="verificar-card__icona verificar-card__icona--ok auth-card__centrado" aria-hidden="true">
                        <span className="tick-icon" />
                    </div>
                    <h1 className="auth-card__titulo auth-card__centro">
                        Revisa o teu correo
                    </h1>
                    <p className="auth-card__subtexto">
                        Enviámosche un correo de verificación. Preme na ligazón para activar a túa conta.
                    </p>
                    <button
                        className="btn btn--primary auth-submit--full"
                        onClick={() => navigate('/login')}
                    >
                        Ir ao login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <AppLogo className="auth-logo" />

                <h1 className="auth-card__title">{t('auth.rexistro.titulo')}</h1>
                <p className="auth-card__subtitle">
                    {t('auth.rexistro.subtitulo')}
                </p>

                {serverError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        {serverError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <FormInput
                        id="nome"
                        label={t('auth.rexistro.campaNome')}
                        type="text"
                        value={fields.nome}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.nome}
                        placeholder={t('auth.rexistro.placeholderNome')}
                        autoComplete="name"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="username"
                        label={t('auth.rexistro.campoUsuaria')}
                        type="text"
                        value={fields.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.username}
                        placeholder={t('auth.rexistro.placeholderUsuaria')}
                        autoComplete="username"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="correo"
                        label={t('auth.rexistro.campoCorreo')}
                        type="email"
                        value={fields.correo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.correo}
                        placeholder={t('auth.rexistro.placeholderCorreo')}
                        autoComplete="email"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="password"
                        label={t('auth.rexistro.campoClave')}
                        type="password"
                        value={fields.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.password}
                        placeholder={t('auth.rexistro.placeholderClave')}
                        autoComplete="new-password"
                        required
                        disabled={isSubmitting}
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

                    <FormInput
                        id="confirmPassword"
                        label={t('auth.rexistro.campoConfirmarClave')}
                        type="password"
                        value={fields.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.confirmPassword}
                        placeholder={t('auth.rexistro.placeholderConfirmarClave')}
                        autoComplete="new-password"
                        required
                        disabled={isSubmitting}
                    />

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner" aria-hidden="true" />
                                {t('auth.rexistro.cargando')}
                            </>
                        ) : (
                            t('auth.rexistro.botonRexistrar')
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    {t('auth.rexistro.textoFooter')}{' '}
                    <Link to="/login">{t('auth.rexistro.ligazonLoginTexto')}</Link>
                </p>
            </div>
        </div>
    );
}
