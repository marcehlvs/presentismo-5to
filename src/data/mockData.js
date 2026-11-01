// Un equipo por cada Jefe de Planta (su líder). Para cambiar un nombre, editá solo 'nombre': los ids no se tocan.
export const TURNOS = [
  { id: 'e1', nombre: 'Equipo Engranajes' },
  { id: 'e2', nombre: 'Equipo Pistones' },
  { id: 'e3', nombre: 'Equipo Turbinas' },
  { id: 'e4', nombre: 'Equipo Palancas' },
  { id: 'e5', nombre: 'Equipo Circuitos' },
];

export const equipoDe = (alumno) => TURNOS.find((t) => t.id === alumno?.turno) ?? null;

export const PUNTAJES_INICIALES = { e1: 0, e2: 0, e3: 0, e4: 0, e5: 0 };

// Jefe de Planta de cada día de la semana
export const ALUMNOS = [
  { id: 1, nombre: 'Gonzalez, V.', dia: 'Lunes', turno: 'e1', avatar: '🦾' },
  { id: 2, nombre: 'Ferrio, M.', dia: 'Martes', turno: 'e2', avatar: '🔧' },
  { id: 3, nombre: 'Mascaros, M.', dia: 'Miércoles', turno: 'e3', avatar: '🚀' },
  { id: 4, nombre: 'Godoy, U.', dia: 'Jueves', turno: 'e4', avatar: '⚙️' },
  { id: 5, nombre: 'Toledo, D.', dia: 'Viernes', turno: 'e5', avatar: '🦺' },
];



export const TAREAS = [
  { id: 'fichaje', momento: 'apertura', titulo: 'Fichaje Anticipado', detalle: 'Llegar antes del timbre y registrar la entrada', icono: 'Timer' },
  { id: 'ventilacion', momento: 'apertura', titulo: 'Ventilación y Pizarra', detalle: 'Abrir ventanas y dejar la pizarra despejada', icono: 'Wind' },
  { id: 'insumos', momento: 'apertura', titulo: 'Pizarra digital lista', detalle: 'Encender la pizarra interactiva y verificar que funcione', icono: 'MonitorCheck' },
  { id: 'asistencia', momento: 'apertura', titulo: 'Presentes y llegadas tarde', detalle: 'Contar cuántos hay y cuántos llegaron tarde (solo cantidades)', icono: 'Users' },
  { id: 'desafio', momento: 'apertura', titulo: 'Desafío en pizarra', detalle: 'Mostrar en la pizarra el desafío que publicó el docente', icono: 'Presentation' },
  { id: 'limpieza', momento: 'cierre', titulo: 'Aula limpia y ordenada', detalle: 'Papeles en el cesto, bancos alineados y piso despejado', icono: 'Sparkles' },
  { id: 'apagado', momento: 'cierre', titulo: 'Pizarra y equipos apagados', detalle: 'Apagar la pizarra interactiva y el proyector', icono: 'Power' },
  { id: 'luces', momento: 'cierre', titulo: 'Luces apagadas y puerta cerrada', detalle: 'Última mirada al aula antes de salir', icono: 'Lightbulb' },
];

// Ed. Física se hace fuera del aula: tiene su propio checklist, que solo aparece los días en que el docente la marca (ver "Días especiales")
export const TAREAS_EDFISICA = [
  { id: 'ef_salida', momento: 'edfisica', titulo: 'Salida ordenada', detalle: 'Aula cerrada, cosas guardadas y el curso en fila hacia el patio o gimnasio', icono: 'DoorOpen' },
  { id: 'ef_equipo', momento: 'edfisica', titulo: 'Ropa y calzado deportivo', detalle: 'Avisar al profe quiénes no trajeron el equipo (solo cantidades)', icono: 'Shirt' },
  { id: 'ef_agua', momento: 'edfisica', titulo: 'Botellas de agua', detalle: 'Cada uno con su botella y recordar tomar agua en los descansos', icono: 'Droplets' },
  { id: 'ef_materiales', momento: 'edfisica', titulo: 'Materiales listos', detalle: 'Ayudar al profe a sacar y contar pelotas, conos y demás materiales', icono: 'PackageOpen' },
  { id: 'ef_devolucion', momento: 'edfisica', titulo: 'Materiales devueltos', detalle: 'Contar y guardar todo en su lugar al terminar', icono: 'PackageCheck' },
  { id: 'ef_regreso', momento: 'edfisica', titulo: 'Regreso ordenado al aula', detalle: 'Volver en fila y sin correr, con el aula abierta y en orden', icono: 'Footprints' },
];

export const MOMENTOS = { apertura: 'Checklist matutino', edfisica: 'Educación Física', cierre: 'Cierre de planta' };

// Ranuras para las tareas que agrega el docente cada día (máximo 5)
export const IDS_EXTRA = ['x1', 'x2', 'x3', 'x4', 'x5'];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Jefe de Planta que le toca al día indicado (null en fin de semana).
// `alumnos` es la lista vigente (los líderes se pueden cambiar desde el panel docente); por defecto, la de este archivo.
export function jefeDelDia(fecha = new Date(), alumnos = ALUMNOS) {
  return alumnos.find((a) => a.dia === DIAS_SEMANA[fecha.getDay()]) ?? null;
}

export function getJornada() {
  const hoy = new Date();
  const dia = hoy.toLocaleDateString('es-AR', { weekday: 'long' });
  return {
    diaNombre: dia.charAt(0).toUpperCase() + dia.slice(1),
  };
}
