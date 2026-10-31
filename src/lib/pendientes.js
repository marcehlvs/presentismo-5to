// Cuántos días hacia atrás se buscan jornadas con algo sin revisar (más viejo que eso se considera cerrado)
export const DIAS_PENDIENTES = 21;

// Lo que el equipo dejó sin aprobar en una jornada: tareas marcadas y todavía sin aprobar, y la respuesta al desafío sin revisar.
// `tareas` son las tareas que correspondían a esa fecha (fijas, Ed. Física y extra).
export function pendientesDe(j, tareas) {
  const sinAprobar = tareas.filter((t) => j.declaradas?.[t.id] && !j.aprobadas?.[t.id]);
  const desafio = j.respuesta != null && !j.desafioAprobado;
  return { tareas: sinAprobar, desafio, hay: sinAprobar.length > 0 || desafio };
}
