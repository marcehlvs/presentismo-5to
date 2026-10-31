import { describe, expect, it } from 'vitest';
import { crearDiasEdFisica, lunesDe, puntosDeJornada, resumenTurnos, sumarDias } from './semanas';

const completa = (fecha, jefeId, ef) => ({ fecha, jefeId, premioChecklist: true, premioCierre: true, desafioAprobado: true, premioEdFisica: ef });

describe('fechas', () => {
  it('lunesDe devuelve el lunes de la semana', () => {
    expect(lunesDe('2026-11-04')).toBe('2026-11-02');
    expect(lunesDe('2026-11-02')).toBe('2026-11-02');
    expect(lunesDe('2026-11-08')).toBe('2026-11-02'); // domingo
  });

  it('sumarDias cruza meses y acepta negativos', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-11-02', -2)).toBe('2026-10-31');
  });
});

describe('Ed. Física', () => {
  it('los lunes y viernes desde el 30/10/2026 hay Ed. Física', () => {
    const ef = crearDiasEdFisica([]);
    expect(ef.has('2026-10-30')).toBe(true); // viernes
    expect(ef.has('2026-11-02')).toBe(true); // lunes
    expect(ef.has('2026-11-04')).toBe(false); // miércoles
    expect(ef.has('2026-10-23')).toBe(false); // viernes anterior a la fecha de inicio
  });

  it('se puede quitar un día puntual y sumar otro', () => {
    const ef = crearDiasEdFisica([{ fecha: '2026-11-02', sinEdFisica: true }, { fecha: '2026-11-04', edFisica: true }]);
    expect(ef.has('2026-11-02')).toBe(false);
    expect(ef.has('2026-11-04')).toBe(true);
  });

  it('un día sin clase nunca tiene Ed. Física', () => {
    const ef = crearDiasEdFisica([{ fecha: '2026-11-02', sinClase: true }, { fecha: '2026-11-04', sinClase: true, edFisica: true }]);
    expect(ef.has('2026-11-02')).toBe(false);
    expect(ef.has('2026-11-04')).toBe(false);
  });
});

describe('puntos y ranking semanal', () => {
  it('puntosDeJornada suma las marcas de premio', () => {
    expect(puntosDeJornada(completa('2026-11-03', 2))).toBe(35);
    expect(puntosDeJornada(completa('2026-11-02', 1, true))).toBe(45);
    expect(puntosDeJornada({})).toBe(0);
  });

  it('un premio retirado (marca en false) no suma', () => {
    expect(puntosDeJornada({ premioChecklist: false, premioCierre: true })).toBe(10);
  });

  it('el promedio es sobre puntos posibles: Ed. Física completa no da ventaja', () => {
    const js = [completa('2026-11-02', 1, true), completa('2026-11-03', 2), completa('2026-11-04', 3), completa('2026-11-05', 4), completa('2026-11-06', 5, true)];
    const ef = { has: (f) => f === '2026-11-02' || f === '2026-11-06' };
    const r = resumenTurnos(js, { diasEdFisica: ef });
    expect(r.lista.every((t) => t.promedio === 35)).toBe(true);
    expect(r.empate).toBe(true);
    expect(r.ganador).toBeNull();
  });

  it('saltear la Ed. Física baja el promedio de ese equipo', () => {
    const js = [completa('2026-11-02', 1, true), completa('2026-11-03', 2), completa('2026-11-06', 5, false)];
    const ef = { has: (f) => f === '2026-11-02' || f === '2026-11-06' };
    const r = resumenTurnos(js, { diasEdFisica: ef });
    expect(r.lista.find((t) => t.id === 'e5').promedio).toBeCloseTo(27.2, 1);
    expect(r.ganador).toBeNull(); // e1 y e2 empatan en 35
  });

  it('los días sin clase no cuentan como jornada', () => {
    const js = [completa('2026-11-02', 1), completa('2026-11-03', 2)];
    const r = resumenTurnos(js, { diasSinClase: new Set(['2026-11-03']) });
    expect(r.lista.find((t) => t.id === 'e2').jornadas).toBe(0);
    expect(r.ganador?.id).toBe('e1');
  });

  it('los bonos suman puntos al equipo', () => {
    const r = resumenTurnos([completa('2026-11-02', 1)], { bonos: [{ turnoId: 'e1', puntos: 20 }] });
    const e1 = r.lista.find((t) => t.id === 'e1');
    expect(e1.puntos).toBe(55);
    expect(e1.bonos).toBe(20);
  });
});
