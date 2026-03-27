// FormInput.jsx
// Reusable labeled input with inline error display.
// Accepts an `error` string — when truthy, shows it below the field
// and applies error styling.

import React from 'react';

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
    return (
        <div className="field">
            <label htmlFor={id} className="field__label">
                {label}
                {required && (
                    <span className="field__required" aria-hidden="true"> *</span>
                )}
            </label>
            <input
                id={id}
                type={type}
                className={`field__input${error ? ' field__input--error' : ''}`}
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
            {error && (
                <p id={`${id}-error`} className="field__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}