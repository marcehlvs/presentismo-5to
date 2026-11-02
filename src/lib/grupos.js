import { TOTAL_CURSO } from '../data/mockData';

// Grupos de la semana: cada líder recibe al azar compañeros (por número de lista) y todos los alumnos quedan en un solo grupo.
// Con 24 alumnos y 5 líderes quedan cuatro grupos de 5 (líder + 4) y uno de 4 (líder + 3). Se guardan solo números de lista.

// Número al azar en [0, 1) con el generador del navegador (no Math.random)
export const rngSeguro = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

function mezclar(lista, rng) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Cuántos pares de compañeros que ya compartieron grupo en semanas anteriores vuelven a coincidir
export function repeticiones(grupos, lideres, previos) {
  let total = 0;
  for (const id of Object.keys(grupos)) {
    const actual = [lideres[id], ...grupos[id]];
    for (const p of previos) {
      for (const idp of Object.keys(p.grupos ?? {})) {
        const antes = new Set([p.lideres?.[idp], ...(p.grupos[idp] ?? [])]);
        const c = actual.filter((n) => antes.has(n)).length;
        total += (c * (c - 1)) / 2;
      }
    }
  }
  return total;
}

// lideres: [{ id, numero }]. previos: sorteos de semanas anteriores ({ lideres, grupos }) para evitar repetir grupos.
// Devuelve { lideres: { id: numero }, grupos: { id: [números] } } (las claves son texto, como se guardan en Firestore).
export function sortearGrupos({ lideres, total = TOTAL_CURSO, previos = [], rng = rngSeguro, intentos = 300 }) {
  const numeros = lideres.map((l) => l.numero);
  if (new Set(numeros).size !== numeros.length || numeros.some((n) => !Number.isInteger(n) || n < 1 || n > total)) {
    throw new Error('Los números de lista de los líderes no son válidos.');
  }
  const resto = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !numeros.includes(n));
  const base = Math.floor(resto.length / lideres.length);
  const conUnoMas = resto.length % lideres.length;
  const mapaLideres = Object.fromEntries(lideres.map((l) => [String(l.id), l.numero]));

  let mejor = null;
  let mejorPuntaje = Infinity;
  for (let t = 0; t < intentos && mejorPuntaje > 0; t++) {
    const orden = mezclar(lideres.map((l) => l.id), rng); // los primeros reciben un compañero más
    const mezcla = mezclar(resto, rng);
    const grupos = {};
    let pos = 0;
    orden.forEach((id, i) => {
      const n = base + (i < conUnoMas ? 1 : 0);
      grupos[String(id)] = mezcla.slice(pos, pos + n).sort((a, b) => a - b);
      pos += n;
    });
    const puntaje = repeticiones(grupos, mapaLideres, previos);
    if (puntaje < mejorPuntaje) { mejor = grupos; mejorPuntaje = puntaje; }
  }
  return { lideres: mapaLideres, grupos: mejor };
}

// Devuelve un mensaje de error, o '' si el sorteo está bien: todos los alumnos en un solo grupo y grupos parejos
export function validarGrupos({ lideres, grupos }, total = TOTAL_CURSO) {
  const numerosLideres = Object.values(lideres ?? {});
  const miembros = Object.values(grupos ?? {}).flat();
  const todos = [...numerosLideres, ...miembros].sort((a, b) => a - b);
  if (todos.length !== total || todos.some((n, i) => n !== i + 1)) return 'Cada número de lista tiene que estar una sola vez.';
  const tamanos = Object.values(grupos).map((g) => g.length);
  if (Math.max(...tamanos) - Math.min(...tamanos) > 1) return 'Los grupos tienen que ser parejos (a lo sumo uno de diferencia).';
  return '';
}

// Números de lista del grupo del líder `id` (el líder primero) o null si no hay sorteo
export function integrantes(sorteo, id) {
  const lider = sorteo?.lideres?.[String(id)];
  const miembros = sorteo?.grupos?.[String(id)];
  return lider == null || !Array.isArray(miembros) ? null : { lider, miembros };
}

// "10 (líder) · 3 · 8 · 12 · 20", o '' si ese líder no tiene grupo sorteado
export function textoGrupo(sorteo, id) {
  const g = integrantes(sorteo, id);
  return g ? [`${g.lider} (líder)`, ...g.miembros].join(' · ') : '';
}
