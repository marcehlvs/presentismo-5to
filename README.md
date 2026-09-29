# Operación: Jefe de Planta

```bash
npm install
npm run dev
```
React 18 + Vite + Tailwind CSS v4 + Lucide React. Datos mockeados en `src/data/mockData.js`, estado global en `src/context/PlantContext.jsx`.

## Firebase (puntos compartidos y aprobación docente)
1. Creá el proyecto y la base Firestore (modo producción). Copiá `.env.example` a `.env` y completá los datos de la app web.
2. Authentication: activá los proveedores **Anónimo** y **Correo/contraseña**.
3. Creá tu usuario docente (Authentication > Users > Add user) y copiá su UID.
4. Firestore: creá la colección `docentes` con un documento cuyo ID sea ese UID (un campo cualquiera, por ejemplo `activo: true`).
5. Publicá las reglas: `firebase deploy --only firestore:rules`.
6. App Check (reCAPTCHA v3): registrá la app, pegá la clave en `VITE_RECAPTCHA_SITE_KEY` y activá "Enforce" al final.
7. `npm run build && firebase deploy --only hosting`.

Los alumnos solo declaran tareas y envían respuestas; los puntos los suma el docente al aprobar.
