# Operación: Jefe de Planta

> 📋 ¿Sos docente? Mirá la [guía de funcionalidades para docentes](README-DOCENTES.md).

```bash
npm install
npm run dev
```
React 18 + Vite + Tailwind CSS v4 + Lucide React + Firebase. Los equipos, las tareas y los líderes iniciales están en `src/data/mockData.js` (los líderes se cambian desde el panel docente, sin tocar el código); el estado global está en `src/context/PlantContext.jsx`.

```bash
npm test             # pruebas de la lógica de puntos, semanas, líderes y pendientes
npm run test:rules   # pruebas de las reglas de Firestore (necesita Firebase CLI y Java; usa el emulador)
```
El CI de GitHub (`.github/workflows/ci.yml`) corre las pruebas y el build en cada push y pull request.

## Firebase (puntos compartidos y aprobación docente)
1. Creá el proyecto y la base Firestore (modo producción). Copiá `.env.example` a `.env` y completá los datos de la app web.
2. Authentication: activá los proveedores **Anónimo** y **Correo/contraseña**.
3. Creá tu usuario docente (Authentication > Users > Add user) y copiá su UID.
4. Firestore: creá la colección `docentes` con un documento cuyo ID sea ese UID (un campo cualquiera, por ejemplo `activo: true`).
5. Publicá las reglas: `firebase deploy --only firestore:rules`.
6. App Check (reCAPTCHA v3): registrá la app, pegá la clave en `VITE_RECAPTCHA_SITE_KEY` y activá "Enforce" al final.
7. `npm run build && firebase deploy --only hosting`.

Las reglas solo dejan a los alumnos escribir jornadas de **ayer, hoy o mañana** (hora de Argentina, calculada por el servidor): nadie puede inventar fechas ni modificar días viejos. Si un dispositivo tiene la fecha muy corrida, la app muestra un error de permisos. Antes de publicar cambios en las reglas conviene correr `npm run test:rules`.

Los alumnos solo declaran tareas y envían respuestas; los puntos los suma el docente al aprobar.

## Desafío del día
El docente que tiene la primera hora inicia sesión en "Acceso docente" y publica el desafío (materia, enunciado, pista opcional y su criterio de corrección, que los alumnos no ven). Los alumnos ven el enunciado y envían su respuesta; el docente la aprueba o rechaza. Después de actualizar este código, volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Cierre de planta, asistencia y tareas extra
El checklist tiene dos momentos: matutino y cierre de planta (cada uno suma 10 puntos al equipo cuando el docente aprueba todo). La tarea "Presentes y llegadas tarde" guarda solo cantidades. El docente puede agregar hasta 5 tareas extra por día desde su panel. Volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Premio semanal, historial y reinicio
El docente carga un premio por semana (los alumnos lo ven junto al ranking de la semana). El ganador se define en `src/lib/semanas.js` (`CRITERIO_GANADOR`: por promedio de puntos por jornada o por total). El historial semanal sale de las jornadas guardadas. "Volver a cero" (solo la cuenta superadmin) pide escribir REINICIAR, descarga una copia en Excel del historial y después borra jornadas, bonos, el desafío y las tareas extra de hoy y deja los puntos de los cinco equipos en cero. La casilla del cartel solo permite reiniciar aunque la copia falle. Borra primero jornadas y bonos y pone los puntos en cero al final: si se corta a mitad de camino, se puede volver a ejecutar sin problema. Volvé a publicar las reglas: `firebase deploy --only firestore:rules`.

## Equipos y líderes
Hay un equipo por cada Jefe de Planta (su líder), y cada uno tiene su día de la semana. Los nombres de los equipos se cambian en `TURNOS`, dentro de `src/data/mockData.js`; los ids (`e1`…`e5`) no se tocan, así que renombrar no afecta los datos guardados.

**Cambiar de líder sin tocar el código:** en el panel docente, "Líderes de la semana". Elegís desde qué fecha rige el cambio (por defecto, el próximo lunes), editás nombres y días y guardás. Cada equipo conserva su puesto y sus puntos; lo anterior no se modifica, así que el historial, el resumen y la planilla muestran el líder de cada día. Los cambios se guardan en `config/lideres` y se pueden quitar desde la misma lista. Si no hay ningún cambio cargado, rigen los líderes de `ALUMNOS` en `mockData.js`.

## Suplente, días sin clase y bonos
En el panel docente, "Suplentes y días sin clase" trabaja por fecha (colección `dias`):
- **Suplente:** si el líder falta, el docente escribe quién lo reemplaza. El suplente entra desde el inicio (ve su nombre en la lista) y usa la jornada del líder, así que los puntos van igual al equipo del líder.
- **Día sin clase:** ese día no se puede iniciar turno, no se aprueban tareas y sus jornadas no cuentan para el promedio ni para el ranking semanal. Si el día ya tenía puntos, siguen en la tabla de posiciones (el panel avisa). El líder de un día sin clase puede hacer su jornada otro día de la semana y cuenta normal.
- **Feriados nacionales precargados:** `src/data/feriados.js` lista los feriados desde el 23/11/2026 hasta fines de 2027 (Ley 27.399); se marcan solos como día sin clase y ese día no tiene Ed. Física. Si en un feriado sí hay clase, el docente elige la fecha y toca "Hay clase este día" (se guarda `conClase` en `dias/{fecha}`, solo para esa fecha). Los días no laborables y los puentes turísticos no se precargan: se marcan a mano. Para 2027 faltan los puentes que fija el Gobierno por decreto y el eventual traslado del 20/11/2027: agregarlos en ese archivo, ordenados por fecha (la prueba `src/lib/feriados.test.js` revisa el formato).
- **Bonos:** puntos extra (1 a 100) para un equipo, con motivo y fecha (colección `bonos`). Suman a la tabla de posiciones y al ranking de la semana de esa fecha; un bono cargado por error se puede quitar y se restan los puntos. Los atajos "Semana perfecta" y "Cero llegadas tarde" están en `BONOS_SUGERIDOS` (`src/lib/semanas.js`).
- "Volver a cero" con la casilla de historial también borra los bonos; los días sin clase y suplentes se conservan.

## Comentarios del docente
Al aprobar o rechazar una tarea (o la respuesta al desafío) el docente puede escribir un comentario. Al rechazar, la tarea vuelve a "sin marcar" y el equipo ve el comentario hasta que la marque otra vez. Se guarda en `devoluciones` dentro de la jornada.

## Aprobaciones pendientes y quitar una aprobación
El panel docente muestra arriba la bandeja **Pendientes de días anteriores**: jornadas de los últimos 21 días (`DIAS_PENDIENTES` en `src/lib/pendientes.js`) con tareas marcadas o respuestas al desafío que nadie aprobó. Se aprueban o rechazan ahí mismo y los puntos se suman al equipo de esa jornada. Los días sin clase no aparecen.

Si el docente **quita la aprobación** de una tarea de un bloque que ya había sumado puntos (matutino, cierre o Ed. Física), el premio de ese bloque se retira y se le restan los puntos al equipo; al volver a aprobar todo, se suman de nuevo (una sola vez). La cuenta de Ed. Física no puede restar puntos (las reglas se lo impiden): si ya se sumaron, la aprobación la quita un docente completo. Una tarea aprobada ya no se puede destildar desde el celular del alumno. La lógica está en `src/lib/premios.js`.

## Modo pantalla
Abrí `/pantalla` en la pantalla interactiva del aula (hay enlaces en el inicio y en el panel docente): ranking y premio en grande, en tiempo real, con botón de pantalla completa. Pasa solo al día siguiente si queda abierta.

## Evolución y planilla
El panel docente muestra un gráfico semanal por equipo (promedio, puntos de la semana o acumulado) y un botón "Exportar a planilla (.xlsx)" con las hojas Jornadas, Semanas, Bonos y Días especiales.

Después de actualizar este código: `npm install` y volvé a publicar las reglas (`firebase deploy --only firestore:rules`), que ahora incluyen `dias` y `bonos`.

## Educación Física
Ed. Física se hace fuera del aula y tiene su propio checklist (salida ordenada, ropa y calzado deportivo, botellas de agua, materiales listos, materiales devueltos y regreso ordenado). Se gestiona así:
- **Qué día hay:** los **lunes y viernes** (`DIAS_EDFISICA_AUTO` en `src/lib/semanas.js`), desde el 30/10/2026 (`EDFISICA_AUTO_DESDE`: las jornadas anteriores no cambian). No hace falta cargar fechas. En "Suplentes, días sin clase y Ed. Física" el docente puede **quitar un día puntual** (lluvia, feriado, profe ausente; se guarda `sinEdFisica` en `dias/{fecha}`) o **sumar otro día** (`edFisica`), solo o repetido ("todos los miércoles hasta tal fecha"). Los días sin clase nunca tienen Ed. Física.
- **Quién lo hace:** el líder del día, en la misma jornada. Los alumnos ven un bloque "Educación Física" entre el desafío y el cierre; el docente lo aprueba en el mismo bloque del panel.
- **Superadmin:** en `docentes/{uid}` poné `rol` (string) = `superadmin`. Es docente completo y además el único que ve "Volver a cero" (puntos, historial, bonos, y el desafío y tareas extra de hoy; no toca líderes, días especiales ni premios). Las reglas solo le dejan borrar jornadas a esta cuenta. Los puntos de los equipos, en cambio, se bloquean solo en la pantalla.
- **Cuenta de la docente de Ed. Física (rol restringido):** solo ve y aprueba el bloque de Ed. Física (nada de desafío, bonos, reinicio ni resto del panel). Para crearla: Authentication > Users > Add user con su correo y una contraseña; copiá su UID; en Firestore creá `docentes/{ese UID}` con el campo `rol` (string) = `edfisica`. Sin ese campo, la cuenta es docente completo. Las reglas lo hacen cumplir en el servidor: solo puede tocar tareas `ef_*`, el premio de Ed. Física y sumar 10 puntos a un equipo (no puede restar, ni sumar otra cantidad).
- **Puntos:** 10 al equipo cuando se aprueba todo (`PUNTOS_EDFISICA` en `src/lib/semanas.js`). Para que el equipo al que le toca Ed. Física no tenga ventaja, el promedio semanal se calcula sobre los puntos posibles (es "puntos por jornada común", hasta 35). Con `CRITERIO_GANADOR = 'total'` esa ventaja existe.
- **Tareas propias:** las tareas extra pueden asignarse al momento "Educación Física" y solo aparecen ese día.
- Las reglas de Firestore cambiaron (tareas `ef_*` y `config`): volvé a publicarlas con `firebase deploy --only firestore:rules`.

## Resumen semanal para imprimir
En el panel docente, "Resumen semanal para imprimir": elegís la semana, ves la hoja (posiciones, detalle por día, asistencia, bonos y días sin clase) y tocás "Imprimir o guardar PDF". Sale en una hoja A4 sin el resto de la app.

## App instalable
La app se puede instalar en el celular o la computadora (PWA): `public/manifest.webmanifest`, `public/sw.js` e íconos en `public/`. No hace falta App Inventor ni una app aparte.
- **Android y computadora (Chrome/Edge):** botón "Instalar la app en este dispositivo" en la pantalla de inicio, o menú ⋮ > "Instalar aplicación".
- **iPhone/iPad (Safari):** Compartir > "Agregar a inicio".
- El service worker solo se registra en la versión publicada. Siempre busca primero en internet (una versión nueva se ve apenas se publica) y usa la copia guardada solo si no hay conexión. Los datos siguen necesitando internet.
- Después de actualizar: `npm run build && firebase deploy`.
