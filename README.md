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

## Suplente, días sin clase y bonos
En el panel docente, "Suplentes y días sin clase" trabaja por fecha (colección `dias`):
- **Suplente:** si el líder falta, el docente escribe quién lo reemplaza. El suplente entra desde el inicio (ve su nombre en la lista) y usa la jornada del líder, así que los puntos van igual al equipo del líder.
- **Día sin clase:** ese día no se puede iniciar turno, no se aprueban tareas y sus jornadas no cuentan para el promedio ni para el ranking semanal. Si el día ya tenía puntos, siguen en la tabla de posiciones (el panel avisa). El líder de un día sin clase puede hacer su jornada otro día de la semana y cuenta normal.
- **Bonos:** puntos extra (1 a 100) para un equipo, con motivo y fecha (colección `bonos`). Suman a la tabla de posiciones y al ranking de la semana de esa fecha; un bono cargado por error se puede quitar y se restan los puntos. Los atajos "Semana perfecta" y "Cero llegadas tarde" están en `BONOS_SUGERIDOS` (`src/lib/semanas.js`).
- "Volver a cero" con la casilla de historial también borra los bonos; los días sin clase y suplentes se conservan.

## Comentarios del docente
Al aprobar o rechazar una tarea (o la respuesta al desafío) el docente puede escribir un comentario. Al rechazar, la tarea vuelve a "sin marcar" y el equipo ve el comentario hasta que la marque otra vez. Se guarda en `devoluciones` dentro de la jornada.

## Modo pantalla
Abrí `/pantalla` en la pantalla interactiva del aula (hay enlaces en el inicio y en el panel docente): ranking y premio en grande, en tiempo real, con botón de pantalla completa. Pasa solo al día siguiente si queda abierta.

## Evolución y planilla
El panel docente muestra un gráfico semanal por equipo (promedio, puntos de la semana o acumulado) y un botón "Exportar a planilla (.xlsx)" con las hojas Jornadas, Semanas, Bonos y Días especiales.

Después de actualizar este código: `npm install` y volvé a publicar las reglas (`firebase deploy --only firestore:rules`), que ahora incluyen `dias` y `bonos`.
