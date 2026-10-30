# Operación: Jefe de Planta — Guía para docentes

Una aplicación web para que el curso se haga cargo, de forma ordenada y con un toque de juego, de las rutinas del aula: abrir el día, hacer una actividad breve, cerrar el aula y, los días que corresponde, salir a Educación Física.

Cada día un alumno es el **Jefe de Planta**. Marca lo que hizo, **el docente lo aprueba** y recién ahí el equipo suma puntos. Al final de la semana hay un ranking y un premio que elige el docente.

> La guía técnica para instalar y publicar la app está en [`README.md`](README.md). Este documento explica qué hace la app y cómo se usa en el día a día.

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

Ed. Física se hace fuera del aula, así que tiene **su propio checklist**, separado del matutino y del cierre. Solo aparece los días en que el docente lo marca.

**Checklist de Ed. Física** (lo completa el Jefe de Planta del día):

1. Salida ordenada: aula cerrada, cosas guardadas y el curso en fila hacia el patio o gimnasio.
2. Ropa y calzado deportivo: avisar al profe quiénes no trajeron el equipo (solo cantidades).
3. Botellas de agua: cada uno con la suya y recordar tomar agua en los descansos.
4. Materiales listos: ayudar al profe a sacar y contar pelotas, conos y demás.
5. Materiales devueltos: contar y guardar todo en su lugar al terminar.
6. Regreso ordenado al aula: volver en fila y sin correr, con el aula abierta y en orden.

**Cómo se organiza**

- **Qué días hay:** en el panel docente, sección *Suplentes, días sin clase y Ed. Física*, se marca la fecha puntual o se repite "todos los martes hasta tal fecha". Cada fecha queda cargada por separado, así que se puede quitar una sola por lluvia, feriado o ausencia del profe.
- **Quién la aprueba:** cualquier docente con acceso al panel, en el bloque *Educación Física* de cada líder. Si la quiere aprobar el profe de Ed. Física, hay que crearle un usuario docente.
- **Puntos:** 10 al equipo cuando se aprueba todo.
- **Sin ventaja para nadie:** el equipo al que le toca un día con Ed. Física tiene más puntos posibles. Para que no se favorezca, el ranking semanal compara **puntos sobre puntos posibles** (se muestra como "puntos por jornada común", hasta 35).
- **Tareas propias:** el docente puede agregar tareas extra y asignarlas al momento *Educación Física*; solo aparecen ese día.
- **Aviso visible:** los días con Ed. Física, la pantalla del aula muestra "Hoy hay Educación Física".

---

## Lo que ve el docente

Se entra desde *Acceso docente* con correo y contraseña. El panel permite:

- **Aprobar o rechazar** cada tarea, con un comentario opcional. Si se rechaza, la tarea vuelve a "sin marcar" y el equipo ve el comentario hasta que la marque otra vez.
- **Publicar el desafío del día:** materia, enunciado, pista opcional (aparece solo si se rechaza una respuesta) y un criterio de corrección que **los alumnos no ven**.
- **Agregar hasta 5 tareas extra por día**, al checklist matutino, a Ed. Física o al cierre.
- **Cargar el premio de la semana**, que ven los alumnos junto al ranking.
- **Otorgar bonos** de 1 a 100 puntos a un equipo, con motivo y fecha (por ejemplo "Semana perfecta" o "Cero llegadas tarde"). Un bono cargado por error se puede quitar.
- **Gestionar situaciones del día a día:**
  - **Suplente:** si el líder falta, se escribe quién lo reemplaza. Los puntos van igual al equipo del líder.
  - **Día sin clase:** ese día no se inicia turno, no se aprueban tareas y no cuenta para el promedio, así un feriado no perjudica a nadie.
  - **Cambio de líderes:** se editan nombres y días desde el panel, con fecha de vigencia. Cada equipo conserva su puesto y sus puntos, y el historial muestra quién fue líder cada día.

---

## Seguimiento y reportes

- **Ranking en tiempo real** para alumnos y docentes, con el premio de la semana a la vista.
- **Evolución semanal** por equipo (promedio, puntos de la semana o acumulado).
- **Resumen semanal para imprimir:** posiciones, detalle por día, asistencia, bonos y días sin clase, en una hoja A4 lista para imprimir o guardar como PDF.
- **Exportar a planilla (.xlsx)** con las hojas *Jornadas*, *Semanas*, *Bonos* y *Días especiales*.
- **Historial** de semanas anteriores y opción de **volver a cero** (con la posibilidad de conservar o borrar el historial).

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
- Solo ingresan como docentes las cuentas que el administrador dio de alta.

---

## Uso en celulares y computadoras

La app se puede **instalar** como una aplicación en el celular o la computadora (sin pasar por tiendas):

- **Android y computadora (Chrome o Edge):** botón *Instalar la app en este dispositivo* en la pantalla de inicio.
- **iPhone/iPad (Safari):** Compartir → *Agregar a inicio*.

---

## Cosas a tener en cuenta

- **Requiere internet** en el dispositivo desde el que se marca. Para Ed. Física conviene acordar si el líder marca el checklist en el patio (con celular y conexión) o al volver al aula.
- **El ingreso de los alumnos no usa contraseña:** se elige el nombre de una lista. Como nada suma puntos hasta que el docente aprueba, el control queda siempre en manos del docente.
- **Las cuentas docentes tienen acceso completo al panel:** hoy no hay un rol limitado "solo Ed. Física". Si el profe de Ed. Física aprueba su bloque, puede ver todo el panel.
- **Todo depende de la aprobación docente:** las tareas quedan "esperando aprobación" hasta que un docente las revise, y los puntos no se suman antes. Conviene reservar un momento del día para hacerlo.

---

## Personalización

Los nombres de los equipos, los puntos de cada bloque y el criterio para elegir al ganador de la semana (por promedio o por total) se pueden adaptar a cada curso; lo hace quien mantiene la app. Los detalles técnicos están en [`README.md`](README.md).
