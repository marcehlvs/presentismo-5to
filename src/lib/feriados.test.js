import { describe, expect, it } from 'vitest';
import { FERIADOS, FERIADOS_DESDE, feriadoDe } from '../data/feriados';
import { aplicarFeriados, crearDiasEdFisica, resumenTurnos } from './semanas';

const dow = (iso) => new Date(`${iso}T12:00:00`).getDay();
const completa = (fecha, jefeId) => ({ fecha, jefeId, premioChecklist: true, premioCierre: true, desafioAprobado: true });

describe('lista de feriados', () => {
  it('tiene fechas válidas, ordenadas, sin repetir y en día de semana', () => {
    const fechas = FERIADOS.map((f) => f.fecha);
    expect(fechas.every((f) => /^\d{4}-\d{2}-\d{2}$/.test(f))).toBe(true);
    expect([...fechas].sort()).toEqual(fechas);
    expect(new Set(fechas).size).toBe(fechas.length);
    // un feriado en sábado o domingo no afecta a la escuela: si aparece, casi seguro es un error de carga
    expect(fechas.filter((f) => dow(f) === 0 || dow(f) === 6)).toEqual([]);
    expect(FERIADOS.every((f) => f.motivo.length > 0 && f.motivo.length <= 80)).toBe(true);
  });

  it('feriadoDe ignora lo anterior a FERIADOS_DESDE', () => {
    expect(feriadoDe('2026-11-23')?.motivo).toMatch(/Soberan/);
    expect(feriadoDe('2026-11-24')).toBeNull();
    expect(feriadoDe('2026-10-12')).toBeNull();
    expect(FERIADOS.every((f) => f.fecha >= FERIADOS_DESDE)).toBe(true);
  });
});

describe('aplicarFeriados', () => {
  it('un feriado sin documento en /dias es un día sin clase', () => {
    const r = aplicarFeriados([]);
    const d = r.find((x) => x.fecha === '2026-12-08');
    expect(d).toMatchObject({ sinClase: true, virtual: true });
    expect(d.motivo).toBeTruthy();
  });

  it('si el docente puso "hay clase", ese feriado deja de ser sin clase', () => {
    const r = aplicarFeriados([{ id: '2026-12-08', fecha: '2026-12-08', conClase: true }]);
    const d = r.filter((x) => x.fecha === '2026-12-08');
    expect(d).toHaveLength(1);
    expect(d[0].sinClase).toBe(false);
    expect(d[0].feriado).toBeTruthy();
  });

  it('conserva el motivo y los suplentes que cargó el docente', () => {
    const r = aplicarFeriados([{ id: '2026-12-08', fecha: '2026-12-08', sinClase: true, motivo: 'Acto escolar', suplentes: { 2: 'Pérez, J.' } }]);
    const d = r.find((x) => x.fecha === '2026-12-08');
    expect(d.motivo).toBe('Acto escolar');
    expect(d.suplentes).toEqual({ 2: 'Pérez, J.' });
    expect(d.sinClase).toBe(true);
  });

  it('los días que no son feriado quedan como estaban', () => {
    const dia = { id: '2026-11-25', fecha: '2026-11-25', sinClase: true, motivo: 'Paro' };
    expect(aplicarFeriados([dia]).find((x) => x.fecha === '2026-11-25')).toBe(dia);
  });

  it('desde y hasta acotan los feriados que se suman', () => {
    const r = aplicarFeriados([], { desde: '2026-11-23', hasta: '2026-11-29' });
    expect(r.map((d) => d.fecha)).toEqual(['2026-11-23']);
  });

  it('un feriado en lunes no tiene Ed. Física ni cuenta como jornada', () => {
    const dias = aplicarFeriados([], { desde: '2026-11-23', hasta: '2026-11-29' });
    const ef = crearDiasEdFisica(dias);
    expect(ef.has('2026-11-23')).toBe(false); // lunes feriado
    expect(ef.has('2026-11-27')).toBe(true); // el viernes sigue con Ed. Física
    const sinClase = new Set(dias.filter((d) => d.sinClase).map((d) => d.fecha));
    const r = resumenTurnos([completa('2026-11-23', 1), completa('2026-11-24', 2)], { diasSinClase: sinClase });
    expect(r.lista.find((t) => t.id === 'e1').jornadas).toBe(0);
    expect(r.lista.find((t) => t.id === 'e2').jornadas).toBe(1);
  });
});
