import { describe, expect, it } from 'vitest';
import { ALUMNOS, TOTAL_CURSO } from '../data/mockData';
import { alumnosEn, validarLideres } from './lideres';
import { integrantes, repeticiones, sortearGrupos, textoGrupo, validarGrupos } from './grupos';

// Generador con semilla para que las pruebas sean repetibles
const semilla = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const lideres = ALUMNOS.map((a) => ({ id: a.id, numero: a.numero }));

describe('líderes con número de lista', () => {
  it('los cinco líderes iniciales tienen número de lista distinto', () => {
    expect(ALUMNOS.map((a) => a.numero)).toEqual([10, 6, 17, 9, 23]);
    expect(alumnosEn([], '2026-11-02').map((a) => a.numero)).toEqual([10, 6, 17, 9, 23]);
  });

  it('se valida el número y que no se repita', () => {
    const items = (extra) => ALUMNOS.map((a, i) => ({ id: a.id, nombre: a.nombre, dia: a.dia, ...(extra?.[i] ?? {}) }));
    expect(validarLideres(items())).toBe('');
    expect(validarLideres(items([{ numero: 25 }]))).toMatch(/número de lista/);
    expect(validarLideres(items([{ numero: '' }]))).toMatch(/número de lista/);
    expect(validarLideres(items([{ numero: 6 }]))).toMatch(/mismo número/); // el 6 es de Ferrio
    expect(validarLideres(items([{ numero: 11 }]))).toBe('');
  });
});

describe('sortearGrupos', () => {
  it('reparte a los 24 una sola vez: cuatro grupos de 5 y uno de 4 contando al líder', () => {
    for (let s = 1; s <= 60; s++) {
      const r = sortearGrupos({ lideres, rng: semilla(s) });
      expect(validarGrupos(r)).toBe('');
      const tamanos = Object.keys(r.grupos).map((id) => r.grupos[id].length + 1).sort();
      expect(tamanos).toEqual([4, 5, 5, 5, 5]);
      expect(Object.values(r.grupos).flat().some((n) => Object.values(r.lideres).includes(n))).toBe(false); // ningún líder es compañero de otro
    }
  });

  it('con la misma semilla da lo mismo y con otra, otra cosa', () => {
    expect(sortearGrupos({ lideres, rng: semilla(7) })).toEqual(sortearGrupos({ lideres, rng: semilla(7) }));
    expect(sortearGrupos({ lideres, rng: semilla(7) })).not.toEqual(sortearGrupos({ lideres, rng: semilla(8) }));
  });

  it('el grupo chico no le toca siempre al mismo líder', () => {
    const chicos = new Set();
    for (let s = 1; s <= 80; s++) {
      const r = sortearGrupos({ lideres, rng: semilla(s) });
      chicos.add(Object.keys(r.grupos).find((id) => r.grupos[id].length === 3));
    }
    expect(chicos.size).toBe(5);
  });

  it('evita repetir grupos de semanas anteriores mejor que el azar puro', () => {
    let conEvitar = 0;
    let alAzar = 0;
    for (let s = 1; s <= 25; s++) {
      const previos = [sortearGrupos({ lideres, rng: semilla(1000 + s) }), sortearGrupos({ lideres, rng: semilla(2000 + s) })];
      const evitando = sortearGrupos({ lideres, previos, rng: semilla(s) });
      const azar = sortearGrupos({ lideres, previos, rng: semilla(s), intentos: 1 });
      conEvitar += repeticiones(evitando.grupos, evitando.lideres, previos);
      alAzar += repeticiones(azar.grupos, azar.lideres, previos);
      expect(validarGrupos(evitando)).toBe('');
    }
    expect(conEvitar).toBeLessThan(alAzar * 0.7);
  });

  it('rechaza números de líder repetidos o fuera del curso', () => {
    expect(() => sortearGrupos({ lideres: [{ id: 1, numero: 3 }, { id: 2, numero: 3 }] })).toThrow();
    expect(() => sortearGrupos({ lideres: [{ id: 1, numero: TOTAL_CURSO + 1 }] })).toThrow();
  });

  it('el generador por defecto también funciona', () => {
    expect(validarGrupos(sortearGrupos({ lideres }))).toBe('');
  });
});

describe('validarGrupos e integrantes', () => {
  const ok = sortearGrupos({ lideres, rng: semilla(3) });

  it('detecta números repetidos, faltantes o grupos desparejos', () => {
    const repetido = structuredClone(ok); repetido.grupos['1'][0] = repetido.grupos['2'][0];
    expect(validarGrupos(repetido)).not.toBe('');
    const falta = structuredClone(ok); falta.grupos['1'].pop();
    expect(validarGrupos(falta)).not.toBe('');
    const desparejo = structuredClone(ok);
    const [id1, id2] = Object.keys(desparejo.grupos);
    desparejo.grupos[id1].push(...desparejo.grupos[id2].splice(0, 2));
    expect(validarGrupos(desparejo)).toMatch(/parejos/);
  });

  it('integrantes devuelve el líder y sus compañeros, o null', () => {
    expect(integrantes(ok, 1).lider).toBe(10);
    expect(integrantes(ok, 1).miembros).toEqual(ok.grupos['1']);
    expect(integrantes(null, 1)).toBeNull();
    expect(integrantes(ok, 9)).toBeNull();
  });

  it('textoGrupo escribe el grupo con el líder primero', () => {
    const t = { lideres: { 1: 10 }, grupos: { 1: [3, 8, 12] } };
    expect(textoGrupo(t, 1)).toBe('10 (líder) · 3 · 8 · 12');
    expect(textoGrupo(t, 2)).toBe('');
    expect(textoGrupo(null, 1)).toBe('');
  });
});
