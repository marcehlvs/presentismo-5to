import { defineConfig } from 'vitest/config';

// Pruebas de la lógica (puntos, semanas, líderes): `npm test`
export default defineConfig({
  test: { include: ['src/**/*.test.js'] },
});
