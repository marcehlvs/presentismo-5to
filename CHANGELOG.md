# Historial de versiones — Operación: Jefe de Planta

Aplicación desarrollada por **Juan Marcelo Bejarano**. La versión actual es la **1.5.0** (1 de noviembre de 2026).

Cada versión indica qué cambió para los docentes y si hubo que publicar las reglas de Firestore (`firebase deploy --only firestore:rules`; siempre antes que la app).

## [1.5.0] — 1/11/2026
**Para los docentes**
- **El panel docente ahora está organizado en cinco solapas**, en lugar de una sola pantalla larga:
  - **Hoy:** avisos, pendientes de días anteriores, desafío de hoy, tareas extra y la aprobación de las jornadas de los líderes.
  - **Semana:** premio de la semana, resumen semanal e historial de la evolución por equipo.
  - **Calendario:** suplentes, días sin clase y Ed. Física puntual, y los días de Educación Física de la semana.
  - **Líderes:** líderes de la semana con su avatar, y los PIN.
  - **Puntos:** bonos, verificar puntos, historial y exportación a Excel, y "Volver a cero".
- Se recuerda la última solapa abierta mientras la pestaña siga abierta, y lo que estés escribiendo en un formulario no se pierde al cambiar de solapa. Se puede navegar con las flechas del teclado.
- La tabla de posiciones acompaña a *Hoy* y *Semana*; en el celular no se repite al pie de las otras solapas.

**Técnico:** componente `Solapas.jsx` (accesible: roles `tablist`/`tab`/`tabpanel`) y `src/lib/solapas.js` con su prueba. Sin cambios en las reglas.

## [1.4.2] — 1/11/2026
**Para los docentes**
- **Arreglo del panel docente y de la pantalla del jefe en el celular:** la página se desbordaba hacia la derecha (tarjetas cortadas, encabezado que no cubría todo el ancho). Ahora todo se ajusta al ancho de la pantalla y las tablas se desplazan dentro de su propia tarjeta.

**Técnico:** las grillas con columnas por breakpoint ahora declaran su columna base (`grid-cols-1` o `minmax(0,1fr)`), y una prueba (`src/lib/layout.test.js`) evita que vuelva a pasar. Sin cambios en las reglas.

## [1.4.1] — 1/11/2026
**Para los docentes**
- **Mostrar u ocultar lo que se escribe** en la contraseña del acceso docente y en el PIN de los líderes: un botón con un ojito al costado del campo.

**Técnico:** sin cambios en las reglas.

## [1.4.0] — 1/11/2026
**Para los docentes**
- **PIN por líder (opcional).** En el panel, la sección *PIN de los líderes* permite cargar un PIN de 4 números por líder. Quien quiera tomar el mando de ese líder tiene que escribirlo. Sin PIN cargado, todo funciona como antes. El PIN solo lo ve el docente.
- **Versión y autoría** visibles al pie del inicio de sesión, de la pantalla del jefe y del panel docente.

**Técnico**
- Reglas nuevas: `pines/{id}` (solo docentes), `sesiones/{uid}` y `config/pines`; las jornadas de un líder con PIN solo las escribe una sesión que probó el PIN. **Hay que publicar las reglas.** Con ninguna cuenta con PIN cargado no cambia nada, así que se puede publicar antes de usarlo.
- 11 pruebas nuevas de reglas (`npm run test:rules`) y una prueba que exige que `package.json` y este archivo tengan la misma versión.

## [1.3.0] — 1/11/2026
**Para los docentes**
- **Verificar puntos.** Compara el contador de la tabla de posiciones con el total calculado desde las jornadas y los bonos, y permite corregir las diferencias.
- **Avatar del Jefe de Planta.** Cada líder tiene un avatar que se ve en su pantalla, en el inicio de sesión, en la tabla y en el modo pantalla. Se elige junto con el nombre y el día en *Líderes de la semana*.

**Técnico:** sin cambios en las reglas. 8 pruebas nuevas.

## [1.2.0] — 1/11/2026
**Para los docentes**
- **Feriados nacionales precargados** como días sin clase (desde el 23/11/2026 hasta fines de 2027). Si ese día sí hay clase, se toca *Hay clase este día*. Los días no laborables y los puentes turísticos no se precargan.
- **Días de Educación Física configurables** desde el panel, con fecha de vigencia: el historial no cambia. Por defecto siguen siendo lunes y viernes.
- **Un equipo sin ninguna jornada en la semana no compite por el premio** (sus bonos igual suman).
- Si falla la conexión al verificar la cuenta docente, la app lo avisa y ofrece reintentar, en lugar de decir que no hay permisos.

**Técnico:** reglas: `config/edfisica`. Una prueba compara los ids de las tareas de `mockData.js` con los de `firestore.rules`. Se dejaron de versionar los logs del emulador.

## [1.1.0] — 31/10/2026
**Para los docentes**
- **Quitar una aprobación resta los puntos** (antes dejaba el premio del bloque).
- **Bandeja "Pendientes de días anteriores":** permite aprobar lo de los últimos 21 días.
- Aprobar y rechazar funcionan con la fecha de la jornada, no solo con la de hoy. Una tarea aprobada ya no se puede destildar desde el celular del alumno.
- "Volver a cero" se puede repetir si se corta. Aclaración en la tabla: es acumulada y el ganador semanal se define aparte.

**Técnico:** reglas: los alumnos solo escriben jornadas de ayer, hoy o mañana (hora de Argentina, calculada por el servidor). Dependencias actualizadas (`vite`), carga diferida de los paneles (el archivo principal bajó de 759 kB a 202 kB), caché del service worker corregida, cabeceras de seguridad, pruebas con Vitest y GitHub Action de integración continua.

## [1.0.0] — antes del 31/10/2026
Versión inicial: checklist diario por bloques, aprobación del docente, puntos por equipo, ranking semanal, premio de la semana, Educación Física, suplentes y días sin clase, modo pantalla, exportación a Excel.
