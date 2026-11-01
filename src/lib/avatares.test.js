import { describe, expect, it } from 'vitest';
import { AVATARES, esAvatar } from '../data/avatares';
import { ALUMNOS } from '../data/mockData';
import { alumnosEn, conVersion, limpiarItems, validarLideres } from './lideres';

const items = (extra = {}) => ALUMNOS.map((a) => ({ id: a.id, nombre: a.nombre, dia: a.dia, ...extra }));

describe('avatares de los líderes', () => {
  it('la lista no repite emojis y los líderes iniciales tienen uno válido', () => {
    expect(new Set(AVATARES.map((a) => a.emoji)).size).toBe(AVATARES.length);
    expect(ALUMNOS.every((a) => esAvatar(a.avatar))).toBe(true);
    expect(alumnosEn([], '2026-11-02').map((a) => a.avatar)).toEqual(ALUMNOS.map((a) => a.avatar));
  });

  it('un cambio de líderes puede traer avatar nuevo; sin avatar conserva el del puesto', () => {
    const lista = items().map((x) => (x.id === 2 ? { ...x, nombre: 'Pérez, J.', avatar: '🐼' } : x));
    const v = conVersion([], '2026-11-09', lista);
    const antes = alumnosEn(v, '2026-11-08');
    const despues = alumnosEn(v, '2026-11-09');
    expect(antes.find((a) => a.id === 2).avatar).toBe(ALUMNOS[1].avatar);
    expect(despues.find((a) => a.id === 2)).toMatchObject({ nombre: 'Pérez, J.', avatar: '🐼' });
    expect(despues.find((a) => a.id === 1).avatar).toBe(ALUMNOS[0].avatar);
  });

  it('un avatar inválido se rechaza al guardar y se ignora al leer', () => {
    expect(validarLideres(items({ avatar: '💩' }))).toMatch(/avatar/i);
    expect(validarLideres(items({ avatar: '🐼' }))).toBe('');
    expect(validarLideres(items())).toBe('');
    expect(limpiarItems(items({ avatar: 'hola' })).every((x) => !('avatar' in x))).toBe(true);
    const roto = [{ desde: '2026-11-09', items: items({ avatar: '💩' }) }];
    expect(alumnosEn(roto, '2026-11-10').map((a) => a.avatar)).toEqual(ALUMNOS.map((a) => a.avatar));
  });
});
