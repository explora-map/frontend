// LoginPage.jsx
//
// Validation:
//   username: NotBlank, 3–50 chars
//   password: NotBlank, min 8 chars
//
// On success: stores tokens via AuthContext.login() and redirects to
// the originally requested page (from ProtectedRoute state) or /dashboard.

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../services/authApi';
import { useAuth } from '../hooks/useAuth';
import FormInput from '../components/FormInput';
import '../assets/styles/auth.css';

function validate(fields) {
    const errors = {};

    if (!fields.username.trim()) {
        errors.username = 'Username is required.';
    } else if (fields.username.trim().length < 3) {
        errors.username = 'Username must be at least 3 characters.';
    } else if (fields.username.trim().length > 50) {
        errors.username = 'Username must be 50 characters or fewer.';
    }

    if (!fields.password) {
        errors.password = 'Password is required.';
    } else if (fields.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    }

    return errors;
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    // ProtectedRoute may pass a redirect target in location.state
    const from = location.state?.from?.pathname || '/dashboard';
    // RegisterPage may pass a success message
    const successMessage = location.state?.successMessage || '';

    const [fields, setFields] = useState({ username: '', password: '' });
    const [touched, setTouched] = useState({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const errors = validate(fields);
    const visibleErrors = Object.fromEntries(
        Object.entries(errors).filter(
            ([key]) => touched[key] || submitAttempted,
        ),
    );

    function handleChange(e) {
        const { id, value } = e.target;
        setFields((prev) => ({ ...prev, [id]: value }));
        if (serverError) setServerError('');
    }

    function handleBlur(e) {
        setTouched((prev) => ({ ...prev, [e.target.id]: true }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitAttempted(true);
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        setServerError('');

        try {
            const jwtResponse = await apiLogin({
                username: fields.username.trim(),
                password: fields.password,
            });

            // Store tokens in memory + update React auth state
            login(jwtResponse, fields.username.trim());

            // Navigate to the originally requested route or dashboard
            navigate(from, { replace: true });
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 400) {
                setServerError('Invalid username or password.');
            } else {
                setServerError('An unexpected error occurred. Please try again later.');
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

                <h1 className="auth-card__title">Welcome back</h1>
                <p className="auth-card__subtitle">Log in to your account.</p>

                {successMessage && (
                    <div className="auth-alert auth-alert--success" role="status">
                        {successMessage}
                    </div>
                )}

                {serverError && (
                    <div className="auth-alert auth-alert--error" role="alert">
                        {serverError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <FormInput
                        id="username"
                        label="Username"
                        type="text"
                        value={fields.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={visibleErrors.username}
                        placeholder="Your username"
                        autoComplete="username"
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
                        placeholder="Your password"
                        autoComplete="current-password"
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
                                Logging in…
                            </>
                        ) : (
                            'Log in'
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}