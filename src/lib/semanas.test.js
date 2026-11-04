import { describe, expect, it } from 'vitest';
import { crearDiasEdFisica, lunesDe, puntosDeJornada, equiposCalificados, puntosDetalleJornada, resumenTurnos, sumarDias } from './semanas';

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

  it('el promedio es puntos / jornadas, sin normalizar: la Ed. Física sorteada sí da ventaja', () => {
    const js = [completa('2026-11-02', 1, true), completa('2026-11-03', 2), completa('2026-11-04', 3)];
    const r = resumenTurnos(js);
    expect(r.lista.find((t) => t.id === 'e1').promedio).toBe(45);
    expect(r.lista.find((t) => t.id === 'e2').promedio).toBe(35);
    expect(r.ganador.id).toBe('e1');
  });

  it('una jornada vacía (sin nada marcado) no cuenta como jornada', () => {
    const js = [completa('2026-11-02', 1), completa('2026-11-03', 2), { fecha: '2026-11-04', jefeId: 3 }];
    const r = resumenTurnos(js);
    const e3 = r.lista.find((t) => t.id === 'e3');
    expect(e3.jornadas).toBe(0);
    expect(e3.compite).toBe(false);
  });

  it('las extras pagas suman 5 cada una al promedio', () => {
    const j = { ...completa('2026-11-03', 2), premiosExtra: { x1: true, x2: true, x3: false } };
    expect(puntosDeJornada(j)).toBe(35 + 10);
    expect(puntosDetalleJornada(j).extras).toBe(10);
  });

  it('los bonos suman a la tabla acumulada pero no al promedio del ganador', () => {
    const js = [completa('2026-11-02', 1), completa('2026-11-03', 2, false)];
    const r = resumenTurnos(js, { bonos: [{ turnoId: 'e2', puntos: 100 }] });
    const e2 = r.lista.find((t) => t.id === 'e2');
    expect(e2.puntos).toBe(135);
    expect(e2.promedio).toBe(35);
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

  it('un equipo sin jornadas no compite aunque tenga un bono grande', () => {
    const js = [completa('2026-11-02', 1), completa('2026-11-04', 3)];
    // e2 no tuvo jornada (su día fue feriado y no lo recuperó) pero recibió un bono de 100
    const r = resumenTurnos(js, { bonos: [{ turnoId: 'e2', puntos: 100 }] });
    const e2 = r.lista.find((t) => t.id === 'e2');
    expect(e2.puntos).toBe(100); // el bono se muestra
    expect(e2.compite).toBe(false);
    expect(e2.promedio).toBe(0);
    expect(r.lista.at(-1).compite).toBe(false); // y queda al final de la lista
    expect(r.ganador).toBeNull(); // e1 y e3 empatan en 35
    expect(r.empate).toBe(true);
  });

  it('si ningún equipo tuvo jornadas no hay ganador ni empate', () => {
    const r = resumenTurnos([], { bonos: [{ turnoId: 'e1', puntos: 20 }] });
    expect(r.ganador).toBeNull();
    expect(r.empate).toBe(false);
  });
});

describe('bonos sugeridos: equipos que califican', () => {
  const asist = (j, tardes) => ({ ...j, asistencia: { presentes: 20, tardes } });
  it('semana perfecta: todas las jornadas con apertura, desafío y cierre', () => {
    const r = equiposCalificados([completa('2026-11-02', 1), completa('2026-11-03', 2), { ...completa('2026-11-04', 3), premioCierre: false }]);
    expect(r['semana-perfecta']).toEqual(['e1', 'e2']);
  });
  it('cero tardes: con asistencia declarada y sin tardes', () => {
    const r = equiposCalificados([asist(completa('2026-11-02', 1), 0), asist(completa('2026-11-03', 2), 2), completa('2026-11-04', 3)]);
    expect(r['cero-tardes']).toEqual(['e1']);
  });
  it('un día sin clase no cuenta', () => {
    const r = equiposCalificados([{ ...completa('2026-11-02', 1), premioCierre: false }], new Set(['2026-11-02']));
    expect(r['semana-perfecta']).toEqual([]);
  });
});
