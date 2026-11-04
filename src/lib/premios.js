import { MAX_EXTRAS_DIA, PUNTOS_CHECKLIST, PUNTOS_CIERRE, PUNTOS_EDFISICA, PUNTOS_EXTRA } from './semanas';

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

// Tareas extra: son opcionales y no entran en el premio de ningún bloque. Cada una aprobada suma PUNTOS_EXTRA, hasta MAX_EXTRAS_DIA por jornada.
// Se guarda en la jornada qué extras ya pagaron (`premiosExtra: { x1: true }`), así quitar la aprobación resta exactamente lo que se sumó.
// Una extra aprobada con el tope ya alcanzado queda aprobada pero sin puntos (y no se los quita nadie si después se destilda otra).
// Devuelve { cambios, puntos }: lo que hay que guardar en la jornada y los puntos a sumar (o restar) al equipo.
export function premioExtra({ previo, tareaId, valor, maximo = MAX_EXTRAS_DIA, puntos = PUNTOS_EXTRA }) {
  const mapa = previo?.premiosExtra ?? {};
  const otorgado = mapa[tareaId] === true;
  const pagas = Object.values(mapa).filter(Boolean).length;
  if (valor && !otorgado && pagas < maximo) return { cambios: { premiosExtra: { ...mapa, [tareaId]: true } }, puntos };
  if (!valor && otorgado) return { cambios: { premiosExtra: { ...mapa, [tareaId]: false } }, puntos: -puntos };
  return { cambios: {}, puntos: 0 };
}
