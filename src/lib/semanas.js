import { FERIADOS, FERIADOS_DESDE } from '../data/feriados';
import { ALUMNOS, TURNOS } from '../data/mockData';

export const PUNTOS_CHECKLIST = 10;
export const PUNTOS_CIERRE = 10;
export const PUNTOS_DESAFIO = 15;
// Ed. Física: puntos extra del día. Hay Ed. Física los días de la semana que rijan (por defecto DIAS_EDFISICA_AUTO desde EDFISICA_AUTO_DESDE;
// el docente los cambia con fecha de vigencia desde "Días especiales") y los que marque a mano; un día se puede quitar
// (lluvia, feriado, profe ausente) desde "Días especiales".
export const PUNTOS_EDFISICA = 10;
// Largo máximo del texto de una tarea extra (antes 60: cortaba las preguntas)
export const TAREA_EXTRA_MAX = 200;
export const DIAS_EDFISICA_AUTO = [1, 5]; // 1 = lunes … 5 = viernes: lunes y viernes (valor inicial; después se cambia desde el panel)
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
  // Un equipo sin ninguna jornada en la semana (por ejemplo, su día fue feriado y no lo recuperó) no compite por el premio:
  // con solo un bono, su "promedio" sería puntos crudos y le ganaría a equipos que sí trabajaron. Sus bonos igual suman en `puntos`.
  const lista = Object.values(r).map((t) => ({
    ...t,
    compite: t.jornadas > 0,
    promedio: t.jornadas === 0 ? 0 : (t.puntos / t.posibles) * PUNTOS_JORNADA,
  }));
  const clave = (t) => (CRITERIO_GANADOR === 'total' ? t.puntos : t.promedio);
  // Los que compiten van primero, ordenados por el criterio; los que no, al final
  lista.sort((a, b) => (b.compite - a.compite) || (clave(b) - clave(a)));
  const mejor = lista[0].compite ? clave(lista[0]) : 0;
  const empatados = lista.filter((t) => t.compite && clave(t) === mejor);
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

// Días de la semana con Ed. Física, con fecha de vigencia: { desde: 'AAAA-MM-DD', dias: [1, 5] } (1 = lunes … 5 = viernes).
// Se guardan en Firestore (config/edfisica) como una lista de versiones, igual que los líderes. La versión inicial (lunes y viernes
// desde EDFISICA_AUTO_DESDE) siempre está: así un cambio nuevo nunca altera los días anteriores a su fecha.
export const EDFISICA_VERSIONES_DEFECTO = [{ desde: EDFISICA_AUTO_DESDE, dias: DIAS_EDFISICA_AUTO }];

const versionValida = (v) => typeof v?.desde === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.desde) && Array.isArray(v.dias);

// Todas las versiones que rigen (la inicial más las del docente; si comparten fecha, gana la del docente), de la más vieja a la más nueva
export function versionesEdFisica(versiones) {
  const porFecha = new Map(EDFISICA_VERSIONES_DEFECTO.map((v) => [v.desde, v]));
  for (const v of versiones ?? []) if (versionValida(v)) porFecha.set(v.desde, v);
  return [...porFecha.values()].sort((a, b) => a.desde.localeCompare(b.desde));
}

// Días de la semana (1 a 5) con Ed. Física automática en esa fecha: rige la última versión con "desde" menor o igual
export function diasEdFisicaEn(versiones, fecha) {
  const vigente = versionesEdFisica(versiones).filter((v) => v.desde <= fecha).pop();
  return vigente ? vigente.dias.map(Number) : [];
}

const NOMBRES_DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
// "los lunes y viernes", "los lunes, miércoles y viernes", "ningún día de la semana"
export function textoDiasEdFisica(dias) {
  const n = [...dias].sort((a, b) => a - b).map((d) => NOMBRES_DIAS[d - 1]).filter(Boolean);
  if (n.length === 0) return 'ningún día de la semana';
  return `los ${n.length === 1 ? n[0] : `${n.slice(0, -1).join(', ')} y ${n.at(-1)}`}`;
}

// Devuelve un mensaje de error en español, o '' si la lista de días está bien (puede estar vacía: sin Ed. Física automática)
export function validarDiasEdFisica(dias) {
  if (!Array.isArray(dias)) return 'Elegí los días.';
  if (dias.some((d) => !Number.isInteger(d) || d < 1 || d > 5)) return 'Los días van de lunes a viernes.';
  if (new Set(dias).size !== dias.length) return 'Hay un día repetido.';
  return '';
}

// Agrega o reemplaza la versión de esa fecha (solo las del docente: la inicial no se guarda) y deja la lista ordenada
export function conVersionEdFisica(versiones, desde, dias) {
  const limpia = [...new Set(dias.map(Number))].sort((a, b) => a - b);
  return [...(versiones ?? []).filter((v) => v.desde !== desde), { desde, dias: limpia }].sort((a, b) => a.desde.localeCompare(b.desde));
}

export const sinVersionEdFisica = (versiones, desde) => (versiones ?? []).filter((v) => v.desde !== desde);

// ¿Hay Ed. Física ese día? Los días de la semana que rijan esa fecha (`versiones`, ver arriba), salvo que el docente lo haya quitado
// (`sinEdFisica`) o no haya clase; además cuentan los días que el docente marcó a mano (`edFisica`). `dias` son los documentos de /dias.
// Devuelve algo con `.has(fecha)`, como un Set, para usarlo igual que antes.
export function crearDiasEdFisica(dias = [], versiones = []) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const vigentes = versionesEdFisica(versiones);
  return {
    has(fecha) {
      const d = porFecha.get(fecha);
      if (d?.sinClase || d?.sinEdFisica) return false;
      if (d?.edFisica) return true;
      const v = vigentes.filter((x) => x.desde <= fecha).pop();
      return !!v && v.dias.map(Number).includes(deIso(fecha).getDay());
    },
  };
}

// Suma los feriados nacionales (src/data/feriados.js) a los días con novedades que cargó el docente (documentos de /dias):
// cada feriado es "sin clase" salvo que el docente haya dejado `conClase` ("Hay clase este día"). Así todo lo demás
// (resumen, pendientes, Ed. Física, aviso a los alumnos) sigue leyendo `sinClase` como siempre.
// `desde` y `hasta` acotan las fechas (para la semana en curso); los días de la lista que no son feriado quedan igual.
export function aplicarFeriados(dias, { desde = FERIADOS_DESDE, hasta = '9999-12-31', feriados = FERIADOS } = {}) {
  const enRango = feriados.filter((f) => f.fecha >= FERIADOS_DESDE && f.fecha >= desde && f.fecha <= hasta);
  const porFecha = new Map(enRango.map((f) => [f.fecha, f]));
  const vistos = new Set();
  const lista = dias.map((d) => {
    const f = porFecha.get(d.fecha);
    if (!f) return d;
    vistos.add(d.fecha);
    if (d.conClase) return { ...d, sinClase: false, feriado: f.motivo };
    return { ...d, sinClase: true, motivo: d.motivo || f.motivo, feriado: f.motivo };
  });
  for (const f of enRango) {
    if (!vistos.has(f.fecha)) lista.push({ id: f.fecha, fecha: f.fecha, sinClase: true, motivo: f.motivo, feriado: f.motivo, virtual: true });
  }
  return lista;
}
