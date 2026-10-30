import { ALUMNOS, TURNOS } from '../data/mockData';

export const PUNTOS_CHECKLIST = 10;
export const PUNTOS_CIERRE = 10;
export const PUNTOS_DESAFIO = 15;
// Ed. Física: puntos extra del día. Hay Ed. Física los días de DIAS_EDFISICA_AUTO (desde EDFISICA_AUTO_DESDE) y los que el docente
// marque a mano; un día se puede quitar (lluvia, feriado, profe ausente) desde "Días especiales".
export const PUNTOS_EDFISICA = 10;
export const DIAS_EDFISICA_AUTO = [1, 5]; // 0 = domingo … 6 = sábado: lunes y viernes
// Las jornadas anteriores a esta fecha no cambian (no tenían Ed. Física automática)
export const EDFISICA_AUTO_DESDE = '2026-10-30';
// Lo máximo que se puede sumar en una jornada común; los días con Ed. Física tienen PUNTOS_EDFISICA más
export const PUNTOS_JORNADA = PUNTOS_CHECKLIST + PUNTOS_CIERRE + PUNTOS_DESAFIO;

// Bonos: atajos del formulario del docente (después de tocarlos, los valores se pueden cambiar antes de guardar)
export const BONOS_SUGERIDOS = [
  { motivo: 'Semana perfecta', puntos: 20 },
  { motivo: 'Cero llegadas tarde', puntos: 10 },
];
export const BONO_MAXIMO = 100;

// 'promedio': gana el equipo con más puntos por jornada (justo si algún equipo tuvo menos días, por ejemplo por un feriado).
// 'total': gana el equipo con más puntos en la semana.
// En ambos casos los bonos suman puntos y los días sin clase no cuentan como jornada.
export const CRITERIO_GANADOR = 'promedio';

const pad = (n) => String(n).padStart(2, '0');
export const aIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const deIso = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const hoyISO = () => aIso(new Date());

// Lunes de la semana a la que pertenece una fecha 'AAAA-MM-DD'
export function lunesDe(iso) {
  const d = deIso(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return aIso(d);
}

export function sumarDias(iso, n) {
  const d = deIso(iso);
  d.setDate(d.getDate() + n);
  return aIso(d);
}

export const etiquetaSemana = (lunes) => `Semana del ${lunes.slice(8, 10)}/${lunes.slice(5, 7)}`;
export const etiquetaCorta = (lunes) => `${lunes.slice(8, 10)}/${lunes.slice(5, 7)}`;

export function etiquetaDia(iso) {
  const d = deIso(iso);
  return `${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export const puntosDeJornada = (j) =>
  (j.premioChecklist ? PUNTOS_CHECKLIST : 0) + (j.premioCierre ? PUNTOS_CIERRE : 0) + (j.desafioAprobado ? PUNTOS_DESAFIO : 0)
  + (j.premioEdFisica ? PUNTOS_EDFISICA : 0);

export const maximoDeJornada = (conEdFisica) => PUNTOS_JORNADA + (conEdFisica ? PUNTOS_EDFISICA : 0);

// Puntos, bonos, jornadas y promedio por equipo para un conjunto de jornadas; determina el ganador.
// diasSinClase (Set de fechas): sus jornadas no cuentan, así el feriado no baja el promedio de nadie.
// diasEdFisica (Set de fechas): ese día se puede sumar PUNTOS_EDFISICA más. Para que el equipo al que le toca Ed. Física no tenga
// ventaja, el promedio se calcula sobre los puntos posibles: es "puntos por jornada común" (hasta PUNTOS_JORNADA).
// Sin días de Ed. Física, da exactamente puntos / jornadas.
export function resumenTurnos(jornadas, { bonos = [], diasSinClase, diasEdFisica } = {}) {
  const r = Object.fromEntries(TURNOS.map((t) => [t.id, { ...t, puntos: 0, bonos: 0, jornadas: 0, posibles: 0 }]));
  for (const j of jornadas) {
    if (diasSinClase?.has(j.fecha)) continue;
    const turno = ALUMNOS.find((a) => a.id === j.jefeId)?.turno;
    if (!r[turno]) continue;
    r[turno].puntos += puntosDeJornada(j);
    r[turno].jornadas += 1;
    r[turno].posibles += maximoDeJornada(diasEdFisica?.has(j.fecha));
  }
  for (const b of bonos) {
    if (!r[b.turnoId]) continue;
    r[b.turnoId].puntos += b.puntos;
    r[b.turnoId].bonos += b.puntos;
  }
  const lista = Object.values(r).map((t) => ({
    ...t,
    promedio: t.jornadas === 0 ? t.puntos : (t.puntos / t.posibles) * PUNTOS_JORNADA,
  }));
  const clave = (t) => (CRITERIO_GANADOR === 'total' ? t.puntos : t.promedio);
  lista.sort((a, b) => clave(b) - clave(a));
  const mejor = clave(lista[0]);
  const empatados = lista.filter((t) => clave(t) === mejor);
  return {
    lista,
    ganador: mejor > 0 && empatados.length === 1 ? empatados[0] : null,
    empate: mejor > 0 && empatados.length > 1,
  };
}

// Un resumen por cada semana que tenga jornadas o bonos, de la más vieja a la más nueva
export function resumenPorSemana(jornadas, bonos, diasSinClase, diasEdFisica) {
  const lunes = [...new Set([...jornadas.map((j) => lunesDe(j.fecha)), ...bonos.map((b) => lunesDe(b.fecha))])].sort();
  return lunes.map((l) => ({
    lunes: l,
    ...resumenTurnos(
      jornadas.filter((j) => lunesDe(j.fecha) === l),
      { bonos: bonos.filter((b) => lunesDe(b.fecha) === l), diasSinClase, diasEdFisica }
    ),
  }));
}

// ¿Hay Ed. Física ese día? Lunes y viernes por defecto, salvo que el docente lo haya quitado (`sinEdFisica`) o no haya clase;
// además cuentan los días que el docente marcó a mano (`edFisica`). `dias` son los documentos de /dias.
// Devuelve algo con `.has(fecha)`, como un Set, para usarlo igual que antes.
export function crearDiasEdFisica(dias = []) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  return {
    has(fecha) {
      const d = porFecha.get(fecha);
      if (d?.sinClase || d?.sinEdFisica) return false;
      if (d?.edFisica) return true;
      return fecha >= EDFISICA_AUTO_DESDE && DIAS_EDFISICA_AUTO.includes(deIso(fecha).getDay());
    },
  };
}