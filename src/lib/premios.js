import { PUNTOS_CHECKLIST, PUNTOS_CIERRE, PUNTOS_EDFISICA } from './semanas';

// Un premio por bloque del checklist: se otorga cuando el docente aprueba todas las tareas del bloque
// y se retira si después quita la aprobación de alguna de ellas.
const BLOQUES = [
  { momento: 'apertura', marca: 'premioChecklist', puntos: PUNTOS_CHECKLIST },
  { momento: 'cierre', marca: 'premioCierre', puntos: PUNTOS_CIERRE },
  { momento: 'edfisica', marca: 'premioEdFisica', puntos: PUNTOS_EDFISICA },
];

// Decide qué premios cambian al aprobar (valor = true) o quitar la aprobación (valor = false) de una tarea.
//  previo         jornada antes del cambio (con sus marcas premioChecklist / premioCierre / premioEdFisica)
//  momentoTarea   bloque al que pertenece la tarea tocada
//  completo       (momento) => true si, con las aprobaciones nuevas, ese bloque quedó completo
//  edFisicaVigente  ese día hay Ed. Física (si no, ese bloque no se toca)
//  soloEdFisica   cuenta restringida de Ed. Física: solo puede tocar el bloque de Ed. Física
// Devuelve { cambios, puntos }: las marcas a guardar en la jornada y los puntos a sumar (o restar) al equipo.
export function premiosTrasAprobacion({ previo, valor, momentoTarea, completo, edFisicaVigente, soloEdFisica = false }) {
  const cambios = {};
  let puntos = 0;
  for (const b of BLOQUES) {
    if (soloEdFisica && b.momento !== 'edfisica') continue;
    if (b.momento === 'edfisica' && !edFisicaVigente) continue;
    const otorgado = previo?.[b.marca] === true;
    if (valor && !otorgado && completo(b.momento)) {
      cambios[b.marca] = true;
      puntos += b.puntos;
    } else if (!valor && otorgado && b.momento === momentoTarea) {
      cambios[b.marca] = false;
      puntos -= b.puntos;
    }
  }
  return { cambios, puntos };
}
