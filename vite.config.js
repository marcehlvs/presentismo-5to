import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600, // el archivo de Firebase pesa ~500 kB y es lo esperado
    rollupOptions: {
      output: {
        // Firebase es lo más pesado y casi no cambia: en un archivo aparte, el navegador lo conserva entre versiones de la app
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/app-check'] },
      },
    },
  },
});
