import React, { useEffect, useRef, useId } from 'react';
import ReactDOM from 'react-dom';

export default function FormModal({ title, onClose, children }) {
    const dialogRef = useRef(null);
    const openerRef = useRef(null);
    const titleId = useId();

    // Garda o elemento que tiña o foco e devólvello ao pechar
    useEffect(() => {
        openerRef.current = document.activeElement;
        return () => {
            openerRef.current?.focus();
        };
    }, []);

    // Auto-foco no primeiro campo interactivo do corpo (non o botón de pechar)
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const firstInput = dialog.querySelector(
            '.form-modal__body input:not([disabled]):not([tabindex="-1"]), ' +
            '.form-modal__body select:not([disabled]), ' +
            '.form-modal__body textarea:not([disabled])'
        );
        const fallback = dialog.querySelector('button:not([disabled])');
        (firstInput || fallback)?.focus();
    }, []);

    // Escape + focus trap (Tab / Shift+Tab non sae do modal)
    useEffect(() => {
        function onKeyDown(e) {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const dialog = dialogRef.current;
            if (!dialog) return;

            const focusable = Array.from(
                dialog.querySelectorAll(
                    'button:not([disabled]), [href], ' +
                    'input:not([disabled]):not([tabindex="-1"]), ' +
                    'select:not([disabled]), textarea:not([disabled]), ' +
                    '[tabindex]:not([tabindex="-1"])'
                )
            ).filter((el) => !el.closest('[aria-hidden="true"]'));

            if (focusable.length === 0) return;
            const first = focusable[0];
            const last  = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return ReactDOM.createPortal(
        <div
            className="form-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                ref={dialogRef}
                className="form-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="form-modal__header">
                    <h2 className="form-modal__title" id={titleId}>{title}</h2>
                    <button
                        className="form-modal__close"
                        onClick={onClose}
                        aria-label="Pechar"
                        type="button"
                    >
                        ×
                    </button>
                </div>
                <div className="form-modal__body">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
