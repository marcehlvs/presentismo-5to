import { rngSeguro } from './grupos';

// Sorteo de Ed. Física con rotación: en cada día de Ed. Física se sortea un líder y su equipo hace el checklist de Ed. Física (+10).
// Nadie repite hasta que salieron los cinco; después empieza una ronda nueva. Así la ventaja se reparte y no le toca siempre al mismo equipo.
//
// `sorteos` son los sorteos anteriores ([{ fecha, jefeId }], en cualquier orden) y `ids` los líderes que pueden salir (1 a 5).

// Líderes que ya salieron en la ronda en curso (la ronda se reinicia cada vez que salieron todos)
export function yaSalieron(sorteos, ids) {
  let usados = new Set();
  for (const s of [...sorteos].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    if (!ids.includes(s.jefeId)) continue;
    usados.add(s.jefeId);
    if (usados.size === ids.length) usados = new Set();
  }
  return [...usados];
}

// Los que todavía pueden salir en esta ronda
export const quedanPorSalir = (sorteos, ids) => {
  const usados = yaSalieron(sorteos, ids);
  return ids.filter((id) => !usados.includes(id));
};

// Elige un líder al azar entre los que faltan salir. `excluir` son líderes que no pueden salir hoy (por ejemplo, el docente sabe que faltó):
// si dejarían la lista vacía, se ignoran. Devuelve el id del líder.
export function sortearEdFisica({ sorteos, ids, excluir = [], rng = rngSeguro }) {
  const faltan = quedanPorSalir(sorteos, ids);
  const posibles = faltan.filter((id) => !excluir.includes(id));
  const lista = posibles.length > 0 ? posibles : faltan;
  return lista[Math.min(Math.floor(rng() * lista.length), lista.length - 1)];
}
