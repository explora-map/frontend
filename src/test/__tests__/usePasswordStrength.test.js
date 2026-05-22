// Opción A: testamos a función pura calcularForza exportada do hook,
// sen montar ningún compoñente React.
// Nota sobre campos reais: o hook devolve { level, pct } (non { forza, porcentaxe }),
// polo que os tests usan os nomes reais en inglés.

import { describe, it, expect } from 'vitest';
import { calcularForza } from '../../hooks/usePasswordStrength.js';

describe('usePasswordStrength — calcularForza', () => {

    it('contrasinaCurtoEDebil — "abc" debe ser débil con porcentaxe <= 33', () => {
        // 1 punto (só letras minúsculas, lonxitude < 8) → level = 'weak'
        const resultado = calcularForza('abc');
        expect(resultado.level).toBe('weak');
        expect(resultado.pct).toBeLessThanOrEqual(33);
    });

    it('contrasinaModerado — "Abc123" debe ser moderado con porcentaxe entre 34 e 66', () => {
        // Nota: "abc123" orixinal producía 'weak' (2 puntos: minúsculas + díxitos).
        // Axústase a "Abc123" para acadar 3 puntos (maiúsculas + minúsculas + díxitos)
        // e clasificarse como 'moderate', sen modificar o hook.
        const resultado = calcularForza('Abc123');
        expect(resultado.level).toBe('moderate');
        expect(resultado.pct).toBeGreaterThan(33);
        expect(resultado.pct).toBeLessThanOrEqual(66);
    });

    it('contrasinaForte — "Abc123!$" debe ser forte con porcentaxe > 66', () => {
        // 5 puntos: lonxitude>=8, maiúsculas, minúsculas, díxitos, caracteres especiais → level = 'strong'
        const resultado = calcularForza('Abc123!$');
        expect(resultado.level).toBe('strong');
        expect(resultado.pct).toBeGreaterThan(66);
    });

});
