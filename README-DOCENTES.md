# Operación: Jefe de Planta — Guía para docentes

Una aplicación web para que el curso se haga cargo, de forma ordenada y con un toque de juego, de las rutinas del aula: abrir el día, hacer una actividad breve, cerrar el aula y, los días que corresponde, salir a Educación Física.

Cada día un alumno es el **Jefe de Planta**. Marca lo que hizo, **el docente lo aprueba** y recién ahí el equipo suma puntos. Al final de la semana hay un ranking y un premio que elige el docente.

> La guía técnica para instalar y publicar la app está en [`README.md`](README.md). Este documento explica qué hace la app y cómo se usa en el día a día.

**Versión 1.4.2** · Desarrollada por **Juan Marcelo Bejarano** · Historial completo de cambios en [`CHANGELOG.md`](CHANGELOG.md).

## Novedades de esta versión (1.1.0 a 1.4.2)
- **Puntos:** quitar una aprobación resta los puntos; la bandeja *Pendientes de días anteriores* permite aprobar hasta 21 días atrás; *Verificar puntos* compara la tabla con las jornadas y los bonos y corrige diferencias.
- **Calendario:** los feriados nacionales ya vienen marcados como días sin clase (se puede habilitar clase en uno puntual); los días de Educación Física se cambian desde el panel con fecha de vigencia.
- **Premio semanal:** un equipo sin ninguna jornada en la semana no compite.
- **Líderes:** cada Jefe de Planta tiene un **avatar** y, si querés, un **PIN de 4 números** para que nadie tome el turno de otro.
- **Seguridad:** los alumnos solo pueden escribir jornadas de ayer, hoy o mañana.
- **Celular:** el panel docente y la pantalla del jefe se ajustan al ancho del teléfono (antes se cortaban a la derecha).
- **Contraseña visible a pedido:** en el acceso docente y en el PIN hay un botón (ojito) para mostrar u ocultar lo que escribís.

---

## ¿Cómo funciona?

- Hay **5 equipos**, uno por cada Jefe de Planta, y cada equipo tiene su **día de la semana** (de lunes a viernes).
- El Jefe de Planta del día entra a la app, elige su nombre y completa los bloques de la jornada.
- El docente revisa desde su panel y **aprueba o rechaza** cada tarea. Los alumnos nunca pueden sumarse puntos solos.
- Los puntos van al equipo del líder. El ranking se ve en el celular y en la pantalla del aula.

### Una jornada típica

| Momento | Qué hace el Jefe de Planta | Puntos al aprobar todo |
|---|---|---|
| **Checklist matutino** | Llegar antes del timbre, ventilar y despejar la pizarra, encender la pizarra digital, registrar presentes y llegadas tarde, mostrar el desafío en pizarra | 10 |
| **Control de calidad (desafío del día)** | Responde el desafío que publicó el docente | 15 |
| **Educación Física** *(solo los días que haya)* | Sigue su checklist propio (ver más abajo) | 10 |
| **Cierre de planta** | Aula limpia y ordenada, pizarra y equipos apagados, luces apagadas y puerta cerrada | 10 |

Una jornada común suma hasta **35 puntos**; un día con Ed. Física, hasta **45**.

---

## Educación Física

Ed. Física se hace fuera del aula, así que tiene **su propio checklist**, separado del matutino y del cierre. Aparece **automáticamente los lunes y viernes**, y el docente puede quitarla o sumarla en días puntuales.

**Checklist de Ed. Física** (lo completa el Jefe de Planta del día):

1. Salida ordenada: aula cerrada, cosas guardadas y el curso en fila hacia el patio o gimnasio.
2. Ropa y calzado deportivo: avisar al profe quiénes no trajeron el equipo (solo cantidades).
3. Botellas de agua: cada uno con la suya y recordar tomar agua en los descansos.
4. Materiales listos: ayudar al profe a sacar y contar pelotas, conos y demás.
5. Materiales devueltos: contar y guardar todo en su lugar al terminar.
6. Regreso ordenado al aula: volver en fila y sin correr, con el aula abierta y en orden.

**Cómo se organiza**

- **Qué días hay:** por defecto los **lunes y viernes**, desde el 30/10/2026 (las jornadas anteriores no cambian). Para cambiarlos usá la sección *Días de Educación Física* del panel: marcás los días de la semana y desde qué fecha rigen; lo anterior queda como estaba. No hace falta cargar fechas. En *Suplentes, días sin clase y Ed. Física* se puede **quitar un día puntual** (lluvia, feriado, ausencia del profe) o **sumar otro día**, solo o repetido ("todos los miércoles hasta tal fecha"). Los días sin clase nunca tienen Ed. Física.
- **Quién la aprueba:** cualquier docente con acceso al panel, en el bloque *Educación Física* de cada líder, o la **cuenta de Ed. Física**, que ve un panel reducido con solo ese bloque (ver *Cuentas y permisos*).
- **Puntos:** 10 al equipo cuando se aprueba todo.
- **Sin ventaja para nadie:** el equipo al que le toca un día con Ed. Física tiene más puntos posibles. Para que no se favorezca, el ranking semanal compara **puntos sobre puntos posibles** (se muestra como "puntos por jornada común", hasta 35).
- **Tareas propias:** el docente puede agregar tareas extra y asignarlas al momento *Educación Física*; solo aparecen ese día. Esas tareas extra las aprueba el docente completo, no la cuenta de Ed. Física.
- **Aviso visible:** los días con Ed. Física, la pantalla del aula muestra "Hoy hay Educación Física".

---

## Lo que ve el docente

Se entra desde *Acceso docente* con correo y contraseña. El panel permite:

- **Aprobar o rechazar** cada tarea, con un comentario opcional. Si se rechaza, la tarea vuelve a "sin marcar" y el equipo ve el comentario hasta que la marque otra vez.
  - **Quitar una aprobación:** si ya se habían sumado los puntos del bloque, se le restan al equipo; al aprobar de nuevo se vuelven a sumar, una sola vez. La cuenta de Ed. Física no puede quitar puntos: lo hace un docente completo.
- **Pendientes de días anteriores:** arriba del panel aparece una bandeja con lo que quedó sin revisar en los últimos 21 días, para aprobarlo aunque haya pasado el día.
  - **Tarea que el alumno no marcó:** también se puede rechazar, siempre que se escriba un comentario que explique qué falta. El alumno lo ve en su checklist.
- **Publicar el desafío del día:** materia, enunciado, pista opcional (aparece solo si se rechaza una respuesta) y un criterio de corrección que **los alumnos no ven**.
- **Agregar hasta 5 tareas extra por día**, al checklist matutino, a Ed. Física o al cierre. Cada una puede tener hasta **200 caracteres**, así caben preguntas completas.
- **Cargar el premio de la semana**, que ven los alumnos junto al ranking.
- **Otorgar bonos** de 1 a 100 puntos a un equipo, con motivo y fecha (por ejemplo "Semana perfecta" o "Cero llegadas tarde"). Un bono cargado por error se puede quitar.
- **Gestionar situaciones del día a día:**
  - **Suplente:** si el líder falta, se escribe quién lo reemplaza. Los puntos van igual al equipo del líder.
  - **Día sin clase:** ese día no se inicia turno, no se aprueban tareas y no cuenta para el promedio, así un feriado no perjudica a nadie. Los **feriados nacionales** ya vienen marcados solos; si en uno sí hay clase, elegí la fecha y tocá *Hay clase este día*. Los días no laborables y los puentes no vienen cargados: se marcan a mano.
  - **Cambio de líderes:** se editan nombres y días desde el panel, con fecha de vigencia. Cada equipo conserva su puesto y sus puntos, y el historial muestra quién fue líder cada día.

---

## Seguimiento y reportes

- **Ranking en tiempo real** para alumnos y docentes, con el premio de la semana a la vista. La *Tabla de posiciones* suma los puntos acumulados (los días con Ed. Física pueden sumar 10 más); el *ganador de la semana* se define aparte, por puntos por jornada común, para que nadie tenga ventaja por el día que le toca.
- **Evolución semanal** por equipo (promedio, puntos de la semana o acumulado).
- **Resumen semanal para imprimir:** posiciones, detalle por día, asistencia, bonos y días sin clase, en una hoja A4 lista para imprimir o guardar como PDF.
- **Exportar a planilla (.xlsx)** con las hojas *Jornadas*, *Semanas*, *Bonos* y *Días especiales*.
- **Historial** de semanas anteriores.
- **Volver a cero** (solo la cuenta superadmin): pide escribir REINICIAR, descarga primero una copia en Excel del historial y después borra los puntos de los cinco equipos, el historial (checklists, asistencia, respuestas y bonos de todas las fechas) y el desafío y las tareas extra de hoy. Si la copia falla, no borra nada (salvo que se tilde reiniciar igual). Si se corta a mitad de camino, se puede volver a ejecutar. **No** borra los líderes, los días sin clase, suplentes y Ed. Física, ni los premios de la semana.

---

## Cuentas y permisos

Hay tres tipos de cuenta docente. Todas se dan de alta a mano en Firebase (Authentication, y un documento `docentes/{UID}` en Firestore):

| Cuenta | Cómo se crea | Qué puede hacer |
|---|---|---|
| **Docente** | Documento `docentes/{UID}` sin más campos | Todo el panel: aprobar, desafío, tareas extra, bonos, premios, suplentes, días especiales, líderes, reportes |
| **Docente de Ed. Física** | `docentes/{UID}` con `rol` = `edfisica` | Solo ve y aprueba o rechaza el bloque de Ed. Física del líder del día. No ve el resto del panel. Solo puede sumar los 10 puntos de Ed. Física |
| **Superadmin** | `docentes/{UID}` con `rol` = `superadmin` | Todo lo del docente, y además es la única cuenta que ve **Volver a cero** |

Los permisos los hacen cumplir las reglas de la base de datos, no solo la pantalla. Una excepción: los puntos de los equipos se protegen del reinicio solo en la pantalla.

---

## Modo pantalla para el aula

Abriendo `/pantalla` en la pantalla interactiva, el curso ve en grande el ranking, el premio de la semana y el día actual, actualizado en tiempo real y con botón de pantalla completa. Si queda abierta, pasa sola al día siguiente.

---

## Privacidad y seguridad

- **No se registran nombres de los alumnos presentes ni de los que llegan tarde:** la asistencia se guarda solo como **cantidades** ("presentes" y "llegadas tarde").
- Los alumnos usan la app **sin crear cuenta**; solo declaran tareas y envían la respuesta al desafío (máximo 200 caracteres).
- **Los puntos solo los suma el docente** al aprobar. Las reglas de la base de datos impiden que un alumno modifique puntajes, bonos o aprobaciones.
- Una vez aprobados, la respuesta al desafío y la asistencia **ya no se pueden cambiar**.
- La respuesta esperada del desafío es **visible únicamente para docentes**.
- Solo ingresan como docentes las cuentas que el administrador dio de alta, cada una con su nivel de permisos (ver *Cuentas y permisos*).

---

## Uso en celulares y computadoras

La app se puede **instalar** como una aplicación en el celular o la computadora (sin pasar por tiendas):

- **Android y computadora (Chrome o Edge):** botón *Instalar la app en este dispositivo* en la pantalla de inicio.
- **iPhone/iPad (Safari):** Compartir → *Agregar a inicio*.

---

## Cosas a tener en cuenta

- **Requiere internet** en el dispositivo desde el que se marca. Para Ed. Física conviene acordar si el líder marca el checklist en el patio (con celular y conexión) o al volver al aula.
- **El ingreso de los alumnos no usa contraseña:** se elige el nombre de una lista. Como nada suma puntos hasta que el docente aprueba, el control queda siempre en manos del docente.
- **La cuenta de Ed. Física es de confianza:** solo puede aprobar tareas de su bloque y sumar 10 puntos, pero las reglas no pueden atar esos puntos a una jornada concreta.
- **Todo depende de la aprobación docente:** las tareas quedan "esperando aprobación" hasta que un docente las revise, y los puntos no se suman antes. Conviene reservar un momento del día para hacerlo; lo que se pase de largo queda en la bandeja *Pendientes de días anteriores* durante 21 días.
- **Fechas:** los alumnos solo pueden registrar jornadas de ayer, hoy o mañana. Para un día más viejo, el docente aprueba desde la bandeja de pendientes.

---

## Personalización

Los nombres de los equipos, los puntos de cada bloque y el criterio para elegir al ganador de la semana (por promedio o por total) se pueden adaptar a cada curso; lo hace quien mantiene la app. Los detalles técnicos están en [`README.md`](README.md).

## Avatares, PIN y verificar puntos
- **Avatar del Jefe de Planta:** en *Líderes de la semana* elegís un avatar para cada líder; lo ven en su pantalla, al iniciar el turno, en la tabla y en la pantalla del aula. Se guarda junto con el cambio de líderes y rige desde la fecha elegida.
- **Verificar puntos:** muestra, por equipo, el contador de la tabla y el total calculado desde las jornadas y los bonos. Si coinciden, aparece un ✓. Si no, el calculado es el correcto: tocá *Corregir* (o *Corregir todos*). Conviene mirarlo después de cargar bonos o de aprobar jornadas viejas, y antes de entregar un premio.
- **PIN por líder:** en *PIN de los líderes* cargás (o generás al azar) un PIN de 4 números por líder; vos lo ves, los alumnos no. Al tomar el mando de ese líder, el celular pide el PIN. Entregáselo al líder y, si hay suplente, al suplente. Si lo cambiás, el celular que ya había entrado tiene que escribir el nuevo. Los líderes sin PIN siguen entrando como siempre.
