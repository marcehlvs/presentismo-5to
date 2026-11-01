import { describe, expect, it } from 'vitest';
import { compararPuntos, hayDescuadre } from './verificarPuntos';

const completa = (fecha, jefeId, extra = {}) => ({ fecha, jefeId, premioChecklist: true, premioCierre: true, desafioAprobado: true, ...extra });

describe('compararPuntos', () => {
  it('sin jornadas ni bonos todo es cero y coincide', () => {
    const r = compararPuntos({});
    expect(r).toHaveLength(5);
    expect(hayDescuadre(r)).toBe(false);
  });

  it('suma jornadas (con Ed. Física) y bonos por equipo', () => {
    const jornadas = [completa('2026-11-02', 1, { premioEdFisica: true }), completa('2026-11-03', 2), { fecha: '2026-11-04', jefeId: 3, premioChecklist: true }];
    const bonos = [{ turnoId: 'e1', puntos: 20 }];
    const r = compararPuntos({ jornadas, bonos, puntajes: { e1: 65, e2: 35, e3: 10 } });
    const por = Object.fromEntries(r.map((f) => [f.id, f]));
    expect(por.e1.calculado).toBe(35 + 10 + 20);
    expect(por.e2.calculado).toBe(35);
    expect(por.e3.calculado).toBe(10);
    expect(hayDescuadre(r)).toBe(false);
  });

  it('detecta el descuadre y su signo', () => {
    const r = compararPuntos({ jornadas: [completa('2026-11-02', 1)], puntajes: { e1: 45, e2: 5 } });
    const por = Object.fromEntries(r.map((f) => [f.id, f]));
    expect(por.e1.diferencia).toBe(10); // el contador tiene 10 de más
    expect(por.e2.diferencia).toBe(5); // y e2 no tiene ninguna jornada
    expect(hayDescuadre(r)).toBe(true);
  });

  it('un premio retirado no suma, y un equipo sin documento de turnos cuenta como cero', () => {
    const r = compararPuntos({ jornadas: [{ fecha: '2026-11-02', jefeId: 4, premioChecklist: false, premioCierre: true }] });
    expect(r.find((f) => f.id === 'e4')).toMatchObject({ contador: 0, calculado: 10, diferencia: -10 });
  });

  it('ignora jornadas de líderes desconocidos y bonos de equipos desconocidos', () => {
    const r = compararPuntos({ jornadas: [completa('2026-11-02', 9)], bonos: [{ turnoId: 'e9', puntos: 50 }] });
    expect(hayDescuadre(r)).toBe(false);
  });
});
