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
import { register } from '../services/authApi';
import FormInput from '../components/FormInput';
import '../assets/styles/auth.css';

// ---- Validation rules (matching backend constraints) ---- //
function validate(fields) {
    const errors = {};

    if (!fields.nome.trim()) {
        errors.nome = 'Name is required.';
    } else if (fields.nome.trim().length < 3) {
        errors.nome = 'Name must be at least 3 characters.';
    } else if (fields.nome.trim().length > 20) {
        errors.nome = 'Name must be 20 characters or fewer.';
    }

    if (!fields.username.trim()) {
        errors.username = 'Username is required.';
    } else if (fields.username.trim().length < 4) {
        errors.username = 'Username must be at least 4 characters.';
    } else if (fields.username.trim().length > 20) {
        errors.username = 'Username must be 20 characters or fewer.';
    }

    if (!fields.correo.trim()) {
        errors.correo = 'Email is required.';
    } else if (fields.correo.trim().length < 8) {
        errors.correo = 'Email must be at least 8 characters.';
    } else if (fields.correo.trim().length > 50) {
        errors.correo = 'Email must be 50 characters or fewer.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.correo.trim())) {
        errors.correo = 'Enter a valid email address.';
    }

    if (!fields.password) {
        errors.password = 'Password is required.';
    } else if (fields.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    } else if (fields.password.length > 40) {
        errors.password = 'Password must be 40 characters or fewer.';
    }

    if (!fields.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
    } else if (fields.password !== fields.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
}

export default function RegisterPage() {
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

    const errors = validate(fields);
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

            // Registration succeeded → go to login with a success message
            navigate('/login', {
                state: { successMessage: 'Account created! You can now log in.' },
            });
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
                    setServerError(
                        'Registration failed. The username or email may already be taken.',
                    );
                }
            } else {
                setServerError(
                    'An unexpected error occurred. Please try again later.',
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__logo">
                    <div className="auth-card__logo-icon">🗺</div>
                    <span className="auth-card__logo-name">Explora Map</span>
                </div>

                <h1 className="auth-card__title">Create an account</h1>
                <p className="auth-card__subtitle">
                    Start creating and sharing your custom maps.
                </p>

                {serverError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        {serverError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <FormInput
                        id="nome"
                        label="Full name"
                        type="text"
                        value={fields.nome}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.nome}
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="username"
                        label="Username"
                        type="text"
                        value={fields.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.username}
                        placeholder="adalove"
                        autoComplete="username"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="correo"
                        label="Email address"
                        type="email"
                        value={fields.correo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.correo}
                        placeholder="ada@example.com"
                        autoComplete="email"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="password"
                        label="Password"
                        type="password"
                        value={fields.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.password}
                        placeholder="8–40 characters"
                        autoComplete="new-password"
                        required
                        disabled={isSubmitting}
                    />

                    <FormInput
                        id="confirmPassword"
                        label="Confirm password"
                        type="password"
                        value={fields.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.confirmPassword}
                        placeholder="Repeat your password"
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
                                Creating account…
                            </>
                        ) : (
                            'Create account'
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}