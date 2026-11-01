import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALUMNOS, IDS_EXTRA, TAREAS, TAREAS_EDFISICA, TURNOS } from '../data/mockData';

// Las reglas de Firestore repiten a mano los ids de las tareas, los equipos y la cantidad de líderes.
// Si se agrega o se renombra una tarea sin tocar firestore.rules, los alumnos dejan de poder guardar (y nadie se entera):
// estas pruebas fallan antes de publicar.
const reglas = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

const listaDespuesDe = (marca) => {
  const i = reglas.indexOf(marca);
  expect(i, `no se encontró "${marca}" en firestore.rules`).toBeGreaterThan(-1);
  const m = reglas.slice(i).match(/\[([^\]]*)\]/);
  return m[1].split(',').map((x) => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
};
const ordenados = (a) => [...a].sort();

describe('firestore.rules coincide con mockData.js', () => {
  it('tareas que un alumno puede declarar = fijas + Ed. Física + extra', () => {
    const enReglas = listaDespuesDe("d.declaradas.keys().hasOnly(");
    const enCodigo = [...TAREAS, ...TAREAS_EDFISICA].map((t) => t.id).concat(IDS_EXTRA);
    expect(ordenados(enReglas)).toEqual(ordenados(enCodigo));
  });

  it('tareas que puede tocar el docente de Ed. Física = tareas ef_*', () => {
    const enReglas = listaDespuesDe('.hasOnly([\'ef_salida\'');
    expect(ordenados(enReglas)).toEqual(ordenados(TAREAS_EDFISICA.map((t) => t.id)));
  });

  it('equipos permitidos en los bonos = TURNOS', () => {
    const enReglas = listaDespuesDe('request.resource.data.turnoId in');
    expect(ordenados(enReglas)).toEqual(ordenados(TURNOS.map((t) => t.id)));
  });

  it('jefeId permitido va de 1 a la cantidad de líderes', () => {
    const m = reglas.match(/jefeId >= (\d+) && request\.resource\.data\.jefeId <= (\d+)/);
    expect(m, 'no se encontró el rango de jefeId en las reglas').not.toBeNull();
    expect(Number(m[1])).toBe(Math.min(...ALUMNOS.map((a) => a.id)));
    expect(Number(m[2])).toBe(Math.max(...ALUMNOS.map((a) => a.id)));
  });

  it('las reglas suman PUNTOS_EDFISICA al docente de Ed. Física', () => {
    const sumas = [...reglas.matchAll(/puntos (?:== |== resource\.data\.puntos \+ )(\d+)/g)].map((m) => Number(m[1]));
    expect(sumas.length).toBeGreaterThan(0);
    expect(new Set(sumas).size).toBe(1);
  });
});
