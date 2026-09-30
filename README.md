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

## Desafío del día
El docente que tiene la primera hora inicia sesión en "Acceso docente" y publica el desafío (materia, enunciado, pista opcional y su criterio de corrección, que los alumnos no ven). Los alumnos ven el enunciado y envían su respuesta; el docente la aprueba o rechaza. Después de actualizar este código, volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Cierre de planta, asistencia y tareas extra
El checklist tiene dos momentos: matutino y cierre de planta (cada uno suma 10 puntos al equipo cuando el docente aprueba todo). La tarea "Presentes y llegadas tarde" guarda solo cantidades. El docente puede agregar hasta 5 tareas extra por día desde su panel. Volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Premio semanal, historial y reinicio
El docente carga un premio por semana (los alumnos lo ven junto al ranking de la semana). El ganador se define en `src/lib/semanas.js` (`CRITERIO_GANADOR`: por promedio de puntos por jornada o por total). El historial semanal sale de las jornadas guardadas. "Volver a cero" reinicia los puntos de los equipos y, si se marca la casilla, borra también el historial. Volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Equipos
Hay un equipo por cada Jefe de Planta (su líder), y cada uno tiene su día de la semana. Los nombres se cambian en `TURNOS`, dentro de `src/data/mockData.js`; los ids (`e1`…`e5`) no se tocan, así que renombrar no afecta los datos guardados.
