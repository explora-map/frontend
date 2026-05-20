import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import '../assets/styles/confirm-dialog.css';

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = 'danger',
    onConfirm,
    onCancel,
}) {
    const { t } = useTranslation();
    const resolvedConfirmLabel = confirmLabel ?? t('confirmar.botonConfirmar');
    const resolvedCancelLabel = cancelLabel ?? t('confirmar.botonCancelar');

    const cancelRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            cancelRef.current?.focus();
            document.body.classList.add('body--no-scroll');
        } else {
            document.body.classList.remove('body--no-scroll');
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(e) {
            if (e.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onCancel();
    }

    return ReactDOM.createPortal(
        <div className="confirm-overlay" role="presentation" onClick={handleOverlayClick}>
            <div
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
            >
                <h2 id="confirm-title" className="confirm-dialog__title">{title}</h2>
                <p id="confirm-message" className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <button ref={cancelRef} className="btn btn--ghost" onClick={onCancel}>
                        {resolvedCancelLabel}
                    </button>
                    <button className={`btn btn--${variant}`} onClick={onConfirm}>
                        {resolvedConfirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
