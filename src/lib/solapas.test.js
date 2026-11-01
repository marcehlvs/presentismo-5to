import { describe, expect, it } from 'vitest';
import { siguienteSolapa, solapaValida } from './solapas';

const ids = ['hoy', 'semana', 'calendario'];

describe('solapas', () => {
  it('las flechas avanzan y retroceden dando la vuelta', () => {
    expect(siguienteSolapa(ids, 'hoy', 'ArrowRight')).toBe('semana');
    expect(siguienteSolapa(ids, 'calendario', 'ArrowRight')).toBe('hoy');
    expect(siguienteSolapa(ids, 'semana', 'ArrowLeft')).toBe('hoy');
    expect(siguienteSolapa(ids, 'hoy', 'ArrowLeft')).toBe('calendario');
  });

  it('Inicio y Fin van a los extremos; otras teclas no hacen nada', () => {
    expect(siguienteSolapa(ids, 'semana', 'Home')).toBe('hoy');
    expect(siguienteSolapa(ids, 'semana', 'End')).toBe('calendario');
    expect(siguienteSolapa(ids, 'semana', 'Enter')).toBeNull();
    expect(siguienteSolapa(ids, 'otra', 'ArrowRight')).toBeNull();
    expect(siguienteSolapa([], 'hoy', 'ArrowRight')).toBeNull();
  });

  it('una solapa guardada que ya no existe vuelve a la primera', () => {
    expect(solapaValida(ids, 'semana')).toBe('semana');
    expect(solapaValida(ids, 'borrada')).toBe('hoy');
    expect(solapaValida(ids, null)).toBe('hoy');
  });
});
