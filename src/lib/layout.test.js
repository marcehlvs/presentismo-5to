import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// En el celular, una grilla que solo define columnas desde sm/md/lg tiene una columna "automática" que se ensancha hasta el contenido
// más ancho (tablas, formularios) y desborda toda la página hacia la derecha. Toda grilla con columnas por breakpoint debe declarar
// también su columna base (por ejemplo grid-cols-1 o grid-cols-[minmax(0,1fr)]).
const carpeta = new URL('../components/', import.meta.url);
const SIN_REVISAR = ['ModoPantalla.jsx']; // pantalla del aula (proyector), no se usa en el celular

describe('grillas responsivas', () => {
  it('toda grilla con columnas por breakpoint tiene columna base', () => {
    const malas = [];
    for (const f of readdirSync(carpeta).filter((n) => n.endsWith('.jsx') && !SIN_REVISAR.includes(n))) {
      const texto = readFileSync(new URL(f, carpeta), 'utf8');
      for (const m of texto.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const clases = (m[1] ?? m[2]).split(/\s+/);
        const esGrilla = clases.includes('grid');
        const conBreakpoint = clases.some((c) => /^(sm|md|lg|xl):grid-cols-/.test(c));
        const conBase = clases.some((c) => c.startsWith('grid-cols-'));
        if (esGrilla && conBreakpoint && !conBase) malas.push(`${f}: ${(m[1] ?? m[2]).slice(0, 70)}`);
      }
    }
    expect(malas).toEqual([]);
  });
});
