import { ALUMNOS, PUNTAJES_INICIALES, TURNOS } from '../data/mockData';
import { puntosDeJornada } from './semanas';

// Los puntos de cada equipo existen en dos lugares: el contador `turnos/{id}.puntos` (lo que ve la tabla de posiciones) y las marcas
// de las jornadas más los bonos (de donde salen los resúmenes semanales). Esto calcula el total a partir de las jornadas y los bonos
// y lo compara con el contador, para detectar descuadres (una escritura cortada, un número editado a mano en la consola).
//
// Cuenta TODAS las jornadas, también las de días marcados sin clase: esos puntos siguen en la tabla de posiciones.
export function compararPuntos({ jornadas = [], bonos = [], puntajes = {} }) {
  const calculado = Object.fromEntries(TURNOS.map((t) => [t.id, 0]));
  for (const j of jornadas) {
    const turno = ALUMNOS.find((a) => a.id === j.jefeId)?.turno;
    if (turno in calculado) calculado[turno] += puntosDeJornada(j);
  }
  for (const b of bonos) {
    if (b.turnoId in calculado) calculado[b.turnoId] += Number(b.puntos) || 0;
  }
  return TURNOS.map((t) => {
    const contador = puntajes[t.id] ?? PUNTAJES_INICIALES[t.id] ?? 0;
    return { id: t.id, nombre: t.nombre, contador, calculado: calculado[t.id], diferencia: contador - calculado[t.id] };
  });
}

export const hayDescuadre = (filas) => filas.some((f) => f.diferencia !== 0);
