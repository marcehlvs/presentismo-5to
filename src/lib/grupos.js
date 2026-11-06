import { TOTAL_CURSO } from '../data/mockData';

// Grupos de la semana: cada líder tiene un grupo de compañeros (por número de lista) y todos los alumnos quedan en algún grupo.
// Un grupo puede definirse a mano (por ejemplo, uno ya sorteado en clase) o sortearse; el sorteo solo reparte a los alumnos que
// todavía no tienen grupo. Se guardan solo números de lista.

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

const esNumeroDeLista = (n, total) => Number.isInteger(n) && n >= 1 && n <= total;

// "10, 5 8;1" -> { numeros: [10, 5, 8, 1], error: '' }
export function parsearNumeros(texto, total = TOTAL_CURSO) {
  const partes = String(texto ?? '').split(/[\s,;]+/).filter(Boolean);
  const numeros = [];
  for (const p of partes) {
    const n = Number(p);
    if (!/^\d+$/.test(p) || !esNumeroDeLista(n, total)) return { numeros: [], error: `“${p}” no es un número de lista (de 1 a ${total}).` };
    numeros.push(n);
  }
  return { numeros, error: '' };
}

// lideres: [{ id, numero }].
// fijos: { id: [compañeros] } grupos ya definidos (se respetan tal cual). previos: sorteos de semanas anteriores, para evitar repetirlos.
// soloFijos: guarda solo los grupos fijos, sin sortear el resto.
// Devuelve { lideres: { id: numero }, grupos: { id: [números] } } (las claves son texto, como se guardan en Firestore).
// Un líder puede figurar como compañero en el grupo de otro (si así se definió a mano); sigue teniendo el suyo.
export function sortearGrupos({ lideres, total = TOTAL_CURSO, fijos = {}, soloFijos = false, previos = [], rng = rngSeguro, intentos = 300 }) {
  const numeros = lideres.map((l) => l.numero);
  if (new Set(numeros).size !== numeros.length || numeros.some((n) => !esNumeroDeLista(n, total))) {
    throw new Error('Los números de lista de los líderes no son válidos.');
  }
  const ids = lideres.map((l) => String(l.id));
  const mapaLideres = Object.fromEntries(lideres.map((l) => [String(l.id), l.numero]));

  const grupos = {};
  const vistos = new Set();
  for (const [id, miembros] of Object.entries(fijos)) {
    if (!ids.includes(String(id))) continue;
    const lista = [...new Set(miembros)].sort((a, b) => a - b);
    for (const n of lista) {
      if (!esNumeroDeLista(n, total)) throw new Error(`El n.º ${n} no es un número de lista.`);
      if (n === mapaLideres[String(id)]) throw new Error(`El n.º ${n} es el líder de ese grupo: no puede ser su propio compañero.`);
      if (vistos.has(n)) throw new Error(`El n.º ${n} está en más de un grupo.`);
      vistos.add(n);
    }
    grupos[String(id)] = lista;
  }
  if (soloFijos) return { lideres: mapaLideres, grupos };

  const faltan = ids.filter((id) => !(id in grupos));
  const resto = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !numeros.includes(n) && !vistos.has(n));
  if (faltan.length === 0) {
    if (resto.length) throw new Error(`Quedarían alumnos sin grupo: ${resto.join(', ')}.`);
    return { lideres: mapaLideres, grupos };
  }

  const base = Math.floor(resto.length / faltan.length);
  const conUnoMas = resto.length % faltan.length;
  let mejor = null;
  let mejorPuntaje = Infinity;
  for (let t = 0; t < intentos && mejorPuntaje > 0; t++) {
    const orden = mezclar(faltan, rng); // los primeros reciben un compañero más
    const mezcla = mezclar(resto, rng);
    const sorteados = {};
    let pos = 0;
    orden.forEach((id, i) => {
      const n = base + (i < conUnoMas ? 1 : 0);
      sorteados[id] = mezcla.slice(pos, pos + n).sort((a, b) => a - b);
      pos += n;
    });
    const puntaje = repeticiones(sorteados, mapaLideres, previos);
    if (puntaje < mejorPuntaje) { mejor = sorteados; mejorPuntaje = puntaje; }
  }
  return { lideres: mapaLideres, grupos: { ...grupos, ...mejor } };
}

// Devuelve un mensaje de error, o '' si los grupos están bien: números válidos, ninguno repetido y,
// si `completo`, todos los alumnos con grupo (los líderes tienen el suyo).
export function validarGrupos({ lideres, grupos }, { total = TOTAL_CURSO, completo = true } = {}) {
  const numerosLideres = Object.values(lideres ?? {});
  const vistos = new Set();
  for (const [id, miembros] of Object.entries(grupos ?? {})) {
    for (const n of miembros) {
      if (!esNumeroDeLista(n, total)) return `El n.º ${n} no es un número de lista.`;
      if (n === lideres?.[id]) return `El n.º ${n} es el líder de su propio grupo.`;
      if (vistos.has(n)) return `El n.º ${n} está en más de un grupo.`;
      vistos.add(n);
    }
  }
  if (completo) {
    const sinGrupo = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !numerosLideres.includes(n) && !vistos.has(n));
    if (sinGrupo.length) return `Hay alumnos sin grupo: ${sinGrupo.join(', ')}.`;
  }
  return '';
}

// Números de lista del grupo del líder `id` (el líder primero) o null si no hay sorteo
export function integrantes(sorteo, id) {
  const lider = sorteo?.lideres?.[String(id)];
  const miembros = sorteo?.grupos?.[String(id)];
  return lider == null || !Array.isArray(miembros) ? null : { lider, miembros };
}

// "10 (líder) · 3 · 8 · 12 · 20", o '' si ese líder no tiene grupo
export function textoGrupo(sorteo, id) {
  const g = integrantes(sorteo, id);
  return g ? [`${g.lider} (líder)`, ...g.miembros].join(' · ') : '';
}

// Avisos (no bloquean) sobre grupos definidos a mano: líderes que quedarían en el grupo de otro
export function avisosFijos(lideres, fijos) {
  const avisos = [];
  for (const [id, miembros] of Object.entries(fijos)) {
    for (const n of miembros) {
      const otro = lideres.find((l) => l.numero === n && String(l.id) !== String(id));
      if (otro) avisos.push(`El n.º ${n} es líder (${otro.dia}) y quedaría también en el grupo del ${lideres.find((l) => String(l.id) === String(id))?.dia ?? 'otro líder'}.`);
    }
  }
  return avisos;
}

// ¿Los grupos guardados siguen valiendo con los líderes de hoy? Cuando cambian los líderes después del sorteo, el sorteo guardado
// tiene los números de lista viejos: el líder nuevo puede figurar como compañero de otro y el viejo seguir como líder.
// lideres: [{ id, numero }] (los vigentes). Devuelve { vigente, motivo }.
export function estadoDelSorteo(sorteo, lideres, { total = TOTAL_CURSO } = {}) {
  if (!sorteo) return { vigente: true, motivo: '' };
  const guardados = sorteo.lideres ?? {};
  const cambiaron = lideres.filter((l) => guardados[String(l.id)] !== l.numero);
  if (cambiaron.length > 0) return { vigente: false, motivo: 'Los líderes cambiaron después del sorteo: estos grupos ya no corresponden.' };
  const mapa = Object.fromEntries(lideres.map((l) => [String(l.id), l.numero]));
  const motivo = validarGrupos({ lideres: mapa, grupos: sorteo.grupos }, { total, completo: false });
  return motivo ? { vigente: false, motivo: `Los grupos guardados tienen un error: ${motivo}` } : { vigente: true, motivo: '' };
}

// De los grupos definidos a mano, los que todavía valen con los líderes actuales: el líder de ese grupo no cambió
// y ninguno de sus compañeros es hoy líder. Los demás se descartan (hay que volver a definirlos o sortearlos).
export function manualesVigentes(sorteo, lideres) {
  const guardados = sorteo?.lideres ?? {};
  const numerosLideres = new Set(lideres.map((l) => l.numero));
  const salida = {};
  for (const id of (sorteo?.manuales ?? []).map(String)) {
    const l = lideres.find((x) => String(x.id) === id);
    const miembros = sorteo.grupos?.[id];
    if (!l || guardados[id] !== l.numero || !Array.isArray(miembros)) continue;
    if (miembros.some((n) => numerosLideres.has(n))) continue;
    salida[id] = miembros;
  }
  return salida;
}
