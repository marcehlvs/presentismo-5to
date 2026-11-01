import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AUTOR, VERSION } from './version';

describe('versión', () => {
  it('coincide con la última entrada de CHANGELOG.md', () => {
    const cambios = readFileSync(new URL('../../CHANGELOG.md', import.meta.url), 'utf8');
    expect(cambios.match(/^## \[([^\]]+)\]/m)?.[1]).toBe(VERSION);
  });

  it('la autoría está declarada', () => {
    expect(AUTOR).toBe('Juan Marcelo Bejarano');
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
