import { describe, expect, it } from 'vitest';
import { pendientesDe } from './pendientes';

const tareas = [{ id: 'fichaje' }, { id: 'ventilacion' }, { id: 'luces' }];

describe('pendientesDe', () => {
  it('lista las tareas marcadas y sin aprobar', () => {
    const j = { declaradas: { fichaje: true, ventilacion: true, luces: false }, aprobadas: { fichaje: true } };
    const p = pendientesDe(j, tareas);
    expect(p.tareas.map((t) => t.id)).toEqual(['ventilacion']);
    expect(p.hay).toBe(true);
  });

  it('una respuesta al desafío sin aprobar es un pendiente', () => {
    expect(pendientesDe({ respuesta: '42' }, tareas)).toMatchObject({ desafio: true, hay: true });
    expect(pendientesDe({ respuesta: '42', desafioAprobado: true }, tareas).hay).toBe(false);
  });

  it('una jornada sin nada marcado no tiene pendientes', () => {
    expect(pendientesDe({}, tareas).hay).toBe(false);
  });

  it('no cuenta tareas que ya no existen ese día', () => {
    const p = pendientesDe({ declaradas: { ef_salida: true } }, tareas);
    expect(p.hay).toBe(false);
  });
});
