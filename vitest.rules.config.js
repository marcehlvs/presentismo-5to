import { defineConfig } from 'vitest/config';

// Pruebas de las reglas de Firestore (necesitan el emulador): `npm run test:rules`
export default defineConfig({
  test: { include: ['tests/**/*.test.js'], testTimeout: 20000, fileParallelism: false },
});
