// FormInput.jsx
// Reusable labeled input with inline error display.
// Accepts an `error` string — when truthy, shows it below the field
// and applies error styling.

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FormInput({
    id,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    autoComplete,
    required = false,
    disabled = false,
}) {
    const { t } = useTranslation();
    const [mostrar, setMostrar] = useState(false);
    const isPassword = type === 'password';
    const effectiveType = isPassword ? (mostrar ? 'text' : 'password') : type;

    return (
        <div className="field">
            <label htmlFor={id} className="field__label">
                {label}
                {required && (
                    <span className="field__required" aria-hidden="true"> *</span>
                )}
            </label>
            <div className="field__input-wrapper">
                <input
                    id={id}
                    type={effectiveType}
                    className={`field__input${error ? ' field__input--error' : ''}${isPassword ? ' field__input--has-ollo' : ''}`}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    disabled={disabled}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="btn-ollo"
                        onClick={() => setMostrar(v => !v)}
                        aria-label={mostrar ? t('accesibilidade.ocultarContrasinal') : t('accesibilidade.mostrarContrasinal')}
                    >
                        {mostrar ? '🙈' : '👁️'}
                    </button>
                )}
            </div>
            {error && (
                <p id={`${id}-error`} className="field__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}