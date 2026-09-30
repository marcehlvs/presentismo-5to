import { ALUMNOS, TURNOS } from '../data/mockData';

export const PUNTOS_CHECKLIST = 10;
export const PUNTOS_CIERRE = 10;
export const PUNTOS_DESAFIO = 15;

// 'promedio': gana el equipo con más puntos por jornada (justo si algún equipo tuvo menos días, por ejemplo por un feriado).
// 'total': gana el equipo con más puntos en la semana.
export const CRITERIO_GANADOR = 'promedio';

const pad = (n) => String(n).padStart(2, '0');
const aIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const deIso = (iso) => {
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

export function etiquetaDia(iso) {
  const d = deIso(iso);
  return `${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export const puntosDeJornada = (j) =>
  (j.premioChecklist ? PUNTOS_CHECKLIST : 0) + (j.premioCierre ? PUNTOS_CIERRE : 0) + (j.desafioAprobado ? PUNTOS_DESAFIO : 0);

// Puntos, jornadas y promedio por equipo para un conjunto de jornadas; determina el ganador
export function resumenTurnos(jornadas) {
  const r = Object.fromEntries(TURNOS.map((t) => [t.id, { ...t, puntos: 0, jornadas: 0 }]));
  for (const j of jornadas) {
    const turno = ALUMNOS.find((a) => a.id === j.jefeId)?.turno;
    if (!r[turno]) continue;
    r[turno].puntos += puntosDeJornada(j);
    r[turno].jornadas += 1;
  }
  const lista = Object.values(r).map((t) => ({ ...t, promedio: t.jornadas ? t.puntos / t.jornadas : 0 }));
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
