# Revisión y mejoras (31/10/2026)

Registro de lo que se revisó en el repo, lo que ya se corrigió con el patch y lo que todavía falta.

## Cómo aplicar el patch

Se entregó en dos formatos con el **mismo contenido**: elegí uno, no los dos.

- `presentismo-5to-mejoras.patch`: un solo parche. Se aplica con `git apply presentismo-5to-mejoras.patch` y los cambios quedan sin commitear, para que los revises y hagas el commit que quieras.
- `presentismo-5to-mejoras-commits.mbox`: los mismos cambios en 4 commits ya armados. Se aplica con `git am presentismo-5to-mejoras-commits.mbox` y conserva los mensajes de commit.

Después:

```bash
npm install
npm test               # 32 pruebas de la lógica
npm run test:rules     # pruebas de las reglas (necesita Firebase CLI y Java; usa el emulador)
npm run build
```

Orden recomendado para publicar: primero las reglas (`firebase deploy --only firestore:rules`) y después la app (`firebase deploy --only hosting`).

## Lo que se hizo

### Lógica de aprobaciones
- **Quitar una aprobación resta puntos.** Antes, desaprobar una tarea dejaba el premio del bloque y los puntos del equipo. Ahora se retira el premio y se restan los puntos; al volver a aprobar se suman una sola vez. La lógica está en `src/lib/premios.js`.
- **Bandeja "Pendientes de días anteriores"** (`src/components/Pendientes.jsx`). Antes, lo que no se aprobaba el mismo día quedaba sin puntos para siempre. Ahora se puede aprobar lo de los últimos 21 días.
- **Aprobar y rechazar trabajan con la fecha de la jornada**, no solo con la de hoy (`PlantContext.jsx`, `FilaTareaDocente.jsx`, `RevisionDesafio.jsx`).
- **Una tarea aprobada ya no se puede destildar** desde el celular del alumno (`Checklist.jsx`).
- **"Volver a cero" repetible:** borra primero jornadas y bonos y deja los puntos en cero al final. Si se corta, se vuelve a ejecutar.
- **Aclaración de rankings:** la tabla de posiciones dice que es acumulada y que el ganador semanal se define aparte. No cambió ningún cálculo.

### Reglas de Firestore
- Los alumnos solo pueden escribir jornadas de **ayer, hoy o mañana** (hora de Argentina, calculada por el servidor). Ya no se pueden inventar fechas ni modificar días viejos. El docente no tiene esa restricción.

### Build y hosting
- `npm audit fix`: se resolvieron `vite` y `source-map-js`.
- Los paneles del docente y la pantalla del aula se cargan solo cuando hacen falta, y Firebase queda en su propio archivo. El archivo principal bajó de 759 kB a 202 kB.
- El service worker ya no guarda como archivo un `index.html` que el hosting devuelve cuando falta un asset (caché `v2`).
- `firebase.json`: caché inmutable para `/assets` y headers de seguridad básicos (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- Se agregó `.env.example`, que el README mencionaba pero no existía.

### Pruebas y CI
- 32 pruebas con Vitest de `semanas`, `lideres`, `premios` y `pendientes` (`npm test`).
- 18 pruebas de las reglas de Firestore (`tests/rules.test.js`, `npm run test:rules`).
- GitHub Action (`.github/workflows/ci.yml`) que corre las pruebas y el build en cada push y pull request.

### Documentación
- `README.md` y `README-DOCENTES.md` actualizados: reinicio, puntos por jornada común (35, no 40), bandeja de pendientes, quitar aprobación, reglas de fecha y pruebas.

## Cómo se verificó

- El patch se aplicó sobre un clon limpio del repo, y también el `.mbox` con `git am`.
- 32 pruebas pasan, el build compila y los paneles salen en archivos separados.
- **Sin verificar:** las 18 pruebas de reglas y las reglas nuevas de fecha. El emulador de Firestore no se pudo descargar en el entorno donde se armó el patch. Hay que correr `npm run test:rules` en tu computadora antes de publicar las reglas.

## Lo que falta

### Verificar antes de publicar
- [ ] Correr `npm run test:rules` y revisar que pasen las 18.
- [ ] Alternativa: probar las reglas en el Rules Playground (alumno anónimo crea una jornada de hoy y otra de hace 10 días: la segunda debe fallar).
- [ ] Si después de publicar los alumnos no pueden guardar, volver a publicar las reglas anteriores (`git revert` del commit de reglas y `firebase deploy --only firestore:rules`).
- [ ] Prueba manual con una cuenta docente: aprobar todo un bloque, quitar una aprobación y mirar que el puntaje baje; aprobar una jornada de ayer desde la bandeja.

### Decisiones tuyas
- [ ] **Apellidos de alumnos en un repo público.** Están en `src/data/mockData.js` y en el historial de git. Lo más simple es pasar el repo a privado. Sacar los nombres del código cambia lo que se ve hasta que se carguen los líderes desde el panel, y para borrarlos del historial hay que reescribirlo.
- [x] **Días de Ed. Física.** Confirmado: lunes y viernes. Además ya se pueden cambiar desde el panel (sección *Días de Educación Física*, `config/edfisica`) con fecha de vigencia.
- [ ] **Un solo criterio de ranking.** La tabla acumulada y el ganador semanal pueden mostrar cosas distintas (los días con Ed. Física suman 10 más en la tabla). Por ahora solo se aclaró; si se quiere unificar, hay que elegir cuál manda.
- [x] **Equipo sin jornada en la semana.** Decidido: no compite por el premio (sus bonos igual suman en sus puntos).

### Cambios más grandes
- [ ] **Puntos como fuente única de verdad.** Hoy los puntos son un contador (`turnos`) separado de las jornadas. Por eso la cuenta de Ed. Física puede sumar +10 sin atarlo a una jornada, y un docente puede editar `turnos` a mano. Cerrarlo del todo requiere una Cloud Function (plan Blaze) o calcular los puntos desde jornadas y bonos.
- [ ] **PIN por líder.** Cualquier alumno puede tomar el turno de otro líder y pisar su respuesta antes de que se apruebe.
- [x] **Feriados argentinos precargados** como días sin clase (`src/data/feriados.js`; faltan los puentes de 2027 cuando salga el decreto).
- [x] **Días de Ed. Física guardados en Firestore** en vez de en el código.

### Consola de Firebase
- [ ] Verificar que App Check esté en "Enforce" (hoy solo se activa si existe `VITE_RECAPTCHA_SITE_KEY`).

### Dependencias
- [ ] Quedan 5 avisos de `npm audit`, todos de `firebase` / `@grpc/grpc-js`. Ese módulo solo corre en Node, no en el navegador. No usar `--force` (propone bajar a firebase 9). Se resuelve actualizando firebase a la versión 12 o 13 cuando convenga, probando antes.

### Pendientes menores
- [x] Los ids de las tareas siguen duplicados en `mockData.js` y en `firestore.rules`, pero ahora `src/lib/reglas-ids.test.js` falla si no coinciden.
- [ ] Las reglas no pueden impedir que un alumno destilde una tarea aprobada (también se usa para las rechazadas); hoy lo evita solo la pantalla.
- [ ] Nombres confusos: el repo es `presentismo-5to`, el paquete `jefe-de-planta`, `TURNOS` son equipos y `ALUMNOS` son líderes.
- [x] Si falla la lectura del documento de docente por la red, la app ahora avisa que no se pudo verificar la cuenta y ofrece reintentar.
- [ ] Código sin uso por `RECORDAR_SESION = false` en `PlantContext.jsx`, y el líder elegido no se reinicia al pasar la medianoche.
- [ ] El caché del service worker acumula archivos viejos de versiones anteriores (poco volumen).
