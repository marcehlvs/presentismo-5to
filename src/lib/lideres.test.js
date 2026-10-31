import { describe, expect, it } from 'vitest';
import { ALUMNOS } from '../data/mockData';
import { alumnosEn, conVersion, sinVersion, validarLideres } from './lideres';

const items = (nombres) => ALUMNOS.map((a, i) => ({ id: a.id, nombre: nombres[i] ?? a.nombre, dia: a.dia }));

describe('alumnosEn', () => {
  it('sin cambios cargados rige la lista de mockData', () => {
    expect(alumnosEn([], '2026-11-02')).toEqual(ALUMNOS);
    expect(alumnosEn(undefined, '2026-11-02')).toEqual(ALUMNOS);
  });

  it('un cambio rige desde su fecha y no modifica lo anterior', () => {
    const v = conVersion([], '2026-11-09', items(['Nuevo, A.']));
    expect(alumnosEn(v, '2026-11-08')[0].nombre).toBe(ALUMNOS[0].nombre);
    expect(alumnosEn(v, '2026-11-09')[0].nombre).toBe('Nuevo, A.');
    expect(alumnosEn(v, '2027-01-01')[0].nombre).toBe('Nuevo, A.');
  });

  it('rige la última versión cuya fecha ya llegó', () => {
    let v = conVersion([], '2026-11-02', items(['Uno']));
    v = conVersion(v, '2026-11-16', items(['Dos']));
    expect(alumnosEn(v, '2026-11-10')[0].nombre).toBe('Uno');
    expect(alumnosEn(v, '2026-11-16')[0].nombre).toBe('Dos');
  });

  it('el equipo (turno) de cada puesto no cambia', () => {
    const v = conVersion([], '2026-11-02', items(['Otro']));
    expect(alumnosEn(v, '2026-11-02').map((a) => a.turno)).toEqual(ALUMNOS.map((a) => a.turno));
  });

  it('sinVersion quita solo esa fecha', () => {
    let v = conVersion([], '2026-11-02', items(['Uno']));
    v = conVersion(v, '2026-11-16', items(['Dos']));
    expect(sinVersion(v, '2026-11-16').map((x) => x.desde)).toEqual(['2026-11-02']);
  });
});

describe('validarLideres', () => {
  it('acepta una lista completa', () => {
    expect(validarLideres(items([]))).toBe('');
  });

  it('rechaza nombres vacíos y días repetidos', () => {
    expect(validarLideres(items(['', 'B', 'C', 'D', 'E']))).toMatch(/nombre/);
    const repetido = items([]);
    repetido[1].dia = repetido[0].dia;
    expect(validarLideres(repetido)).toMatch(/mismo día/);
  });

  it('rechaza listas incompletas', () => {
    expect(validarLideres(items([]).slice(0, 3))).toMatch(/Faltan/);
  });
});
