// Navegación por teclado de las solapas (flechas, Inicio y Fin; da la vuelta al llegar al extremo).
// Devuelve el id de la solapa a la que hay que pasar, o null si la tecla no mueve nada.
export function siguienteSolapa(ids, actual, tecla) {
  const i = ids.indexOf(actual);
  if (i === -1 || ids.length === 0) return null;
  if (tecla === 'ArrowRight') return ids[(i + 1) % ids.length];
  if (tecla === 'ArrowLeft') return ids[(i - 1 + ids.length) % ids.length];
  if (tecla === 'Home') return ids[0];
  if (tecla === 'End') return ids[ids.length - 1];
  return null;
}

// Solapa guardada, si todavía existe; si no, la primera
export const solapaValida = (ids, guardada) => (ids.includes(guardada) ? guardada : ids[0]);
