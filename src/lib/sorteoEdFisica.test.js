import { describe, expect, it } from 'vitest';
import { quedanPorSalir, sortearEdFisica, yaSalieron } from './sorteoEdFisica';

const IDS = [1, 2, 3, 4, 5];
const s = (fecha, jefeId) => ({ fecha, jefeId });

describe('sorteo de Ed. Física con rotación', () => {
  it('al empezar, pueden salir los cinco', () => {
    expect(quedanPorSalir([], IDS)).toEqual(IDS);
  });

  it('el que ya salió no vuelve a salir hasta completar la ronda', () => {
    const previos = [s('2026-11-06', 3), s('2026-11-09', 1)];
    expect(yaSalieron(previos, IDS).sort()).toEqual([1, 3]);
    expect(quedanPorSalir(previos, IDS)).toEqual([2, 4, 5]);
    for (const r of [0, 0.34, 0.67, 0.999]) {
      expect([2, 4, 5]).toContain(sortearEdFisica({ sorteos: previos, ids: IDS, rng: () => r }));
    }
  });

  it('cuando salieron los cinco empieza una ronda nueva', () => {
    const cinco = [1, 2, 3, 4, 5].map((id, i) => s(`2026-11-${String(6 + i).padStart(2, '0')}`, id));
    expect(quedanPorSalir(cinco, IDS)).toEqual(IDS);
    const seis = [...cinco, s('2026-11-11', 4)];
    expect(quedanPorSalir(seis, IDS)).toEqual([1, 2, 3, 5]);
  });

  it('no importa el orden en que lleguen los sorteos', () => {
    const a = [s('2026-11-09', 1), s('2026-11-06', 3)];
    const b = [s('2026-11-06', 3), s('2026-11-09', 1)];
    expect(quedanPorSalir(a, IDS)).toEqual(quedanPorSalir(b, IDS));
  });

  it('en una ronda completa cada equipo sale exactamente una vez', () => {
    const sorteos = [];
    for (let i = 0; i < 10; i++) {
      const id = sortearEdFisica({ sorteos, ids: IDS, rng: () => Math.random() });
      sorteos.push(s(`2026-12-${String(i + 1).padStart(2, '0')}`, id));
    }
    expect(new Set(sorteos.slice(0, 5).map((x) => x.jefeId)).size).toBe(5);
    expect(new Set(sorteos.slice(5).map((x) => x.jefeId)).size).toBe(5);
  });

  it('se puede excluir a un líder (por ejemplo, faltó), salvo que no quede nadie', () => {
    const previos = [s('2026-11-06', 1), s('2026-11-09', 2), s('2026-11-11', 3), s('2026-11-13', 4)];
    expect(sortearEdFisica({ sorteos: previos, ids: IDS, excluir: [1] })).toBe(5);
    expect(sortearEdFisica({ sorteos: previos, ids: IDS, excluir: [5] })).toBe(5); // era el único: se ignora la exclusión
  });

  it('un número aleatorio de 1 no se sale de la lista', () => {
    expect(IDS).toContain(sortearEdFisica({ sorteos: [], ids: IDS, rng: () => 1 }));
  });

  it('ignora sorteos de líderes que ya no existen', () => {
    expect(quedanPorSalir([s('2026-11-06', 9)], IDS)).toEqual(IDS);
  });
});
