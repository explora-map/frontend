import { useMemo } from 'react';

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

const META = {
    weak:     { pct: 33,  color: '#DC1B2F' },
    moderate: { pct: 66,  color: '#D98E00' },
    strong:   { pct: 100, color: '#1E9E2C' },
};

export function calcularForza(password) {
    const pwd = password ?? '';

    if (pwd.length === 0) {
        return { level: 'weak', pct: META.weak.pct };
    }

    let points = 0;
    if (pwd.length >= 8)         points += 1;
    if (pwd.length >= 12)        points += 1;
    if (/[A-Z]/.test(pwd))       points += 1;
    if (/[a-z]/.test(pwd))       points += 1;
    if (/[0-9]/.test(pwd))       points += 1;
    if (SPECIAL_CHARS.test(pwd)) points += 1;

    const level = points <= 2 ? 'weak' : points <= 4 ? 'moderate' : 'strong';
    return { level, pct: META[level].pct };
}

export default function usePasswordStrength(password, labels = {
    weak: 'Contrasinal débil',
    moderate: 'Contrasinal moderado',
    strong: 'Contrasinal forte',
}) {
    return useMemo(() => {
        const pwd = password ?? '';

        if (pwd.length === 0) {
            return { level: 'weak', ...META.weak, label: labels.weak, visible: false };
        }

        const { level } = calcularForza(pwd);
        return { level, ...META[level], label: labels[level], visible: true };
    }, [password, labels.weak, labels.moderate, labels.strong]); // eslint-disable-line react-hooks/exhaustive-deps
}
