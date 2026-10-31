import { describe, expect, it } from 'vitest';
import { premiosTrasAprobacion } from './premios';

const completo = (...momentos) => (m) => momentos.includes(m);
const base = { edFisicaVigente: true, soloEdFisica: false };

describe('premiosTrasAprobacion', () => {
  it('otorga 10 puntos cuando el bloque matutino queda completo', () => {
    const r = premiosTrasAprobacion({ ...base, previo: {}, valor: true, momentoTarea: 'apertura', completo: completo('apertura') });
    expect(r).toEqual({ cambios: { premioChecklist: true }, puntos: 10 });
  });

  it('no repite el premio si ya estaba otorgado', () => {
    const r = premiosTrasAprobacion({ ...base, previo: { premioChecklist: true }, valor: true, momentoTarea: 'apertura', completo: completo('apertura') });
    expect(r).toEqual({ cambios: {}, puntos: 0 });
  });

  it('no otorga nada si el bloque todavía no está completo', () => {
    const r = premiosTrasAprobacion({ ...base, previo: {}, valor: true, momentoTarea: 'apertura', completo: completo() });
    expect(r).toEqual({ cambios: {}, puntos: 0 });
  });

  it('al quitar la aprobación de una tarea retira el premio de su bloque y resta los puntos', () => {
    const r = premiosTrasAprobacion({
      ...base, previo: { premioChecklist: true, premioCierre: true }, valor: false, momentoTarea: 'apertura', completo: completo('cierre'),
    });
    expect(r).toEqual({ cambios: { premioChecklist: false }, puntos: -10 });
  });

  it('quitar la aprobación en un bloque sin premio no cambia nada', () => {
    const r = premiosTrasAprobacion({ ...base, previo: { premioCierre: true }, valor: false, momentoTarea: 'apertura', completo: completo() });
    expect(r).toEqual({ cambios: {}, puntos: 0 });
  });

  it('aprobar de nuevo después de quitar vuelve a sumar una sola vez', () => {
    const quitado = premiosTrasAprobacion({ ...base, previo: { premioChecklist: true }, valor: false, momentoTarea: 'apertura', completo: completo() });
    const previo = { premioChecklist: quitado.cambios.premioChecklist };
    const vuelta = premiosTrasAprobacion({ ...base, previo, valor: true, momentoTarea: 'apertura', completo: completo('apertura') });
    expect(quitado.puntos + vuelta.puntos).toBe(0);
    expect(vuelta.cambios).toEqual({ premioChecklist: true });
  });

  it('Ed. Física suma 10 solo si ese día hay Ed. Física', () => {
    const con = premiosTrasAprobacion({ ...base, previo: {}, valor: true, momentoTarea: 'edfisica', completo: completo('edfisica') });
    expect(con).toEqual({ cambios: { premioEdFisica: true }, puntos: 10 });
    const sin = premiosTrasAprobacion({ ...base, edFisicaVigente: false, previo: {}, valor: true, momentoTarea: 'edfisica', completo: completo('edfisica') });
    expect(sin).toEqual({ cambios: {}, puntos: 0 });
  });

  it('la cuenta de Ed. Física solo toca el premio de Ed. Física', () => {
    const r = premiosTrasAprobacion({
      previo: {}, valor: true, momentoTarea: 'edfisica', edFisicaVigente: true, soloEdFisica: true, completo: completo('apertura', 'cierre', 'edfisica'),
    });
    expect(r).toEqual({ cambios: { premioEdFisica: true }, puntos: 10 });
  });

  it('aprobar el cierre y el matutino a la vez suma ambos', () => {
    const r = premiosTrasAprobacion({ ...base, previo: {}, valor: true, momentoTarea: 'cierre', completo: completo('apertura', 'cierre') });
    expect(r.puntos).toBe(20);
    expect(r.cambios).toEqual({ premioChecklist: true, premioCierre: true });
  });
});
