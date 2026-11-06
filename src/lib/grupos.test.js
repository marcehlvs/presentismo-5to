import { describe, expect, it } from 'vitest';
import { ALUMNOS, TOTAL_CURSO } from '../data/mockData';
import { alumnosEn, validarLideres } from './lideres';
import { avisosFijos, estadoDelSorteo, integrantes, manualesVigentes, parsearNumeros, repeticiones, sortearGrupos, textoGrupo, validarGrupos } from './grupos';

// Generador con semilla para que las pruebas sean repetibles
const semilla = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const lideres = ALUMNOS.map((a) => ({ id: a.id, numero: a.numero }));

describe('líderes con número de lista', () => {
  it('el curso tiene 25 alumnos y los líderes iniciales tienen su número de la lista', () => {
    expect(TOTAL_CURSO).toBe(25);
    expect(ALUMNOS.map((a) => a.numero)).toEqual([9, 6, 16, 8, 22]);
    expect(alumnosEn([], '2026-11-02').map((a) => a.numero)).toEqual([9, 6, 16, 8, 22]);
  });

  it('se valida el número y que no se repita', () => {
    const items = (extra) => ALUMNOS.map((a, i) => ({ id: a.id, nombre: a.nombre, dia: a.dia, ...(extra?.[i] ?? {}) }));
    expect(validarLideres(items())).toBe('');
    expect(validarLideres(items([{ numero: 26 }]))).toMatch(/número de lista/);
    expect(validarLideres(items([{ numero: '' }]))).toMatch(/número de lista/);
    expect(validarLideres(items([{ numero: 6 }]))).toMatch(/mismo número/); // el 6 es de Ferrio
    expect(validarLideres(items([{ numero: 11 }]))).toBe('');
  });
});

describe('sortearGrupos', () => {
  it('reparte a los 25: cinco grupos de 5 contando al líder, sin repetir a nadie', () => {
    for (let s = 1; s <= 60; s++) {
      const r = sortearGrupos({ lideres, rng: semilla(s) });
      expect(validarGrupos(r)).toBe('');
      expect(Object.values(r.grupos).map((g) => g.length + 1)).toEqual([5, 5, 5, 5, 5]);
      expect(Object.values(r.grupos).flat().some((n) => Object.values(r.lideres).includes(n))).toBe(false);
    }
  });

  it('con otra cantidad de alumnos, un grupo queda más chico y no siempre es el mismo líder', () => {
    const chicos = new Set();
    for (let s = 1; s <= 80; s++) {
      const r = sortearGrupos({ lideres, total: 24, rng: semilla(s) });
      expect(validarGrupos(r, { total: 24 })).toBe('');
      chicos.add(Object.keys(r.grupos).find((id) => r.grupos[id].length === 3));
    }
    expect(chicos.size).toBe(5);
  });

  it('con la misma semilla da lo mismo y con otra, otra cosa', () => {
    expect(sortearGrupos({ lideres, rng: semilla(7) })).toEqual(sortearGrupos({ lideres, rng: semilla(7) }));
    expect(sortearGrupos({ lideres, rng: semilla(7) })).not.toEqual(sortearGrupos({ lideres, rng: semilla(8) }));
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

describe('grupos definidos a mano', () => {
  // Caso real: el lunes (líder 9) y el martes (líder 6) ya se sortearon en clase; el 8 es líder del jueves
  const fijos = { 1: [1, 5, 8, 10], 2: [2, 3, 4, 21] };

  it('se respetan tal cual y el resto reparte solo a los que no tenían grupo', () => {
    for (let s = 1; s <= 40; s++) {
      const r = sortearGrupos({ lideres, fijos, rng: semilla(s) });
      expect(r.grupos['1']).toEqual([1, 5, 8, 10]);
      expect(r.grupos['2']).toEqual([2, 3, 4, 21]);
      expect(validarGrupos(r)).toBe('');
      const resto = ['3', '4', '5'].flatMap((id) => r.grupos[id]);
      expect(resto.some((n) => [1, 2, 3, 4, 5, 8, 10, 21].includes(n))).toBe(false);
      expect(resto).toHaveLength(13); // 20 alumnos que no son líderes − 7 ya ubicados
      expect(['3', '4', '5'].map((id) => r.grupos[id].length).sort()).toEqual([4, 4, 5]);
    }
  });

  it('soloFijos guarda únicamente lo definido, sin sortear', () => {
    const r = sortearGrupos({ lideres, fijos, soloFijos: true });
    expect(Object.keys(r.grupos).sort()).toEqual(['1', '2']);
    expect(validarGrupos(r, { completo: false })).toBe('');
    expect(validarGrupos(r)).toMatch(/sin grupo/);
  });

  it('un grupo ya sorteado se puede completar con "faltantes" sin tocarlo', () => {
    const primero = sortearGrupos({ lideres, fijos, soloFijos: true });
    const segundo = sortearGrupos({ lideres, fijos: primero.grupos, rng: semilla(5) });
    expect(segundo.grupos['1']).toEqual([1, 5, 8, 10]);
    expect(validarGrupos(segundo)).toBe('');
  });

  it('rechaza compañeros repetidos entre grupos, el propio líder y números fuera del curso', () => {
    expect(() => sortearGrupos({ lideres, fijos: { 1: [1, 2], 2: [2, 3] } })).toThrow(/más de un grupo/);
    expect(() => sortearGrupos({ lideres, fijos: { 1: [9] } })).toThrow(/líder de ese grupo/);
    expect(() => sortearGrupos({ lideres, fijos: { 1: [26] } })).toThrow(/número de lista/);
  });

  it('si no queda ningún líder por sortear y sobran alumnos, avisa', () => {
    const casiTodo = { 1: [1, 2], 2: [3, 4], 3: [5, 7], 4: [10, 11], 5: [12, 13] };
    expect(() => sortearGrupos({ lideres, fijos: casiTodo })).toThrow(/sin grupo/);
  });

  it('avisosFijos señala a un líder que quedaría en el grupo de otro', () => {
    const l = ALUMNOS.map((a) => ({ id: a.id, numero: a.numero, dia: a.dia }));
    expect(avisosFijos(l, fijos)).toHaveLength(1);
    expect(avisosFijos(l, fijos)[0]).toMatch(/n\.º 8 es líder \(Jueves\).*grupo del Lunes/);
    expect(avisosFijos(l, { 1: [1, 5] })).toEqual([]);
  });
});

describe('parsearNumeros', () => {
  it('acepta comas, espacios y puntos y coma', () => {
    expect(parsearNumeros('10, 5 8;1')).toEqual({ numeros: [10, 5, 8, 1], error: '' });
    expect(parsearNumeros('')).toEqual({ numeros: [], error: '' });
  });

  it('avisa si algo no es un número de lista', () => {
    expect(parsearNumeros('3, hola').error).toMatch(/hola/);
    expect(parsearNumeros('0').error).toMatch(/número de lista/);
    expect(parsearNumeros('26').error).toMatch(/de 1 a 25/);
    expect(parsearNumeros('2.5').error).toMatch(/2\.5/);
  });
});

describe('validarGrupos, integrantes y textoGrupo', () => {
  const ok = sortearGrupos({ lideres, rng: semilla(3) });

  it('detecta números repetidos, faltantes o inválidos', () => {
    const repetido = structuredClone(ok); repetido.grupos['1'][0] = repetido.grupos['2'][0];
    expect(validarGrupos(repetido)).not.toBe('');
    const falta = structuredClone(ok); falta.grupos['1'].pop();
    expect(validarGrupos(falta)).toMatch(/sin grupo/);
    const propio = structuredClone(ok); propio.grupos['1'][0] = propio.lideres['1'];
    expect(validarGrupos(propio)).toMatch(/líder de su propio grupo/);
  });

  it('integrantes devuelve el líder y sus compañeros, o null', () => {
    expect(integrantes(ok, 1).lider).toBe(9);
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

describe('líderes que cambian después del sorteo', () => {
  const lideresViejos = [{ id: 1, numero: 10 }, { id: 2, numero: 6 }, { id: 3, numero: 8 }, { id: 4, numero: 16 }, { id: 5, numero: 22 }];
  const sorteo = sortearGrupos({ lideres: lideresViejos, total: 25 });

  it('con los mismos líderes el sorteo vale', () => {
    expect(estadoDelSorteo(sorteo, lideresViejos, { total: 25 }).vigente).toBe(true);
  });

  it('si cambia un líder, el sorteo guardado deja de valer (no se muestran grupos con alumnos repetidos)', () => {
    const nuevos = lideresViejos.map((l) => (l.id === 3 ? { ...l, numero: sorteo.grupos['1'][0] } : l));
    const r = estadoDelSorteo(sorteo, nuevos, { total: 25 });
    expect(r.vigente).toBe(false);
    expect(r.motivo).toMatch(/líderes cambiaron/);
  });

  it('volver a sortear con los líderes nuevos deja a todos en un solo grupo', () => {
    const nuevos = lideresViejos.map((l) => (l.id === 3 ? { ...l, numero: sorteo.grupos['1'][0] } : l));
    const otro = sortearGrupos({ lideres: nuevos, total: 25 });
    expect(validarGrupos(otro, { total: 25 })).toBe('');
    expect(estadoDelSorteo(otro, nuevos, { total: 25 }).vigente).toBe(true);
  });

  it('de los grupos a mano solo quedan los que no se ven afectados', () => {
    const conManuales = { ...sorteo, manuales: [1, 2], grupos: { ...sorteo.grupos, 1: [1, 2, 3, 4], 2: [5, 7, 9, 11] } };
    const nuevos = lideresViejos.map((l) => (l.id === 2 ? { ...l, numero: 7 } : l)); // el líder 2 ahora es el n.º 7
    expect(Object.keys(manualesVigentes(conManuales, nuevos))).toEqual(['1']);
    const nuevosB = lideresViejos.map((l) => (l.id === 3 ? { ...l, numero: 4 } : l)); // el 4 era compañero en el grupo 1
    expect(Object.keys(manualesVigentes(conManuales, nuevosB))).toEqual(['2']);
  });
});
