import { FERIADOS, FERIADOS_DESDE } from '../data/feriados';
import { ALUMNOS, TURNOS } from '../data/mockData';

export const PUNTOS_CHECKLIST = 10;
export const PUNTOS_CIERRE = 10;
export const PUNTOS_DESAFIO = 15;
// Ed. Física: puntos extra del día. Hay Ed. Física los días de la semana que rijan (por defecto DIAS_EDFISICA_AUTO desde EDFISICA_AUTO_DESDE;
// el docente los cambia con fecha de vigencia desde "Días especiales") y los que marque a mano; un día se puede quitar
// (lluvia, feriado, profe ausente) desde "Días especiales".
export const PUNTOS_EDFISICA = 10;
// Tareas extra: son opcionales y no frenan el premio de ningún bloque. Cada una aprobada suma PUNTOS_EXTRA, hasta MAX_EXTRAS_DIA por jornada.
export const PUNTOS_EXTRA = 5;
export const MAX_EXTRAS_DIA = 3;
// Desde esta fecha rige el modelo nuevo: la Ed. Física la hace el líder sorteado (no el líder del día) y las tareas extra son opcionales.
// Las jornadas anteriores se leen como antes, así los puntos ya sumados no cambian.
export const MODELO_NUEVO_DESDE = '2026-11-04';
// Largo máximo del texto de una tarea extra (antes 60: cortaba las preguntas)
export const TAREA_EXTRA_MAX = 200;
export const DIAS_EDFISICA_AUTO = [1, 5]; // 1 = lunes … 5 = viernes: lunes y viernes (valor inicial; después se cambia desde el panel)
// Las jornadas anteriores a esta fecha no cambian (no tenían Ed. Física automática)
export const EDFISICA_AUTO_DESDE = '2026-10-30';
// Lo máximo que se puede sumar en una jornada común; los días con Ed. Física tienen PUNTOS_EDFISICA más
export const PUNTOS_JORNADA = PUNTOS_CHECKLIST + PUNTOS_CIERRE + PUNTOS_DESAFIO;

// Bonos: atajos del formulario del docente (después de tocarlos, los valores se pueden cambiar antes de guardar)
export const BONOS_SUGERIDOS = [
  { id: 'semana-perfecta', motivo: 'Semana perfecta', puntos: 20 },
  { id: 'cero-tardes', motivo: 'Cero llegadas tarde', puntos: 10 },
];
export const BONO_MAXIMO = 100;

// 'promedio': gana el equipo con más puntos por jornada (justo si algún equipo tuvo menos días, por ejemplo por un feriado).
// 'total': gana el equipo con más puntos en la semana.
// En ambos casos los bonos NO cuentan para el ganador (suman a la tabla de posiciones, pero no al promedio) y los días sin clase
// no cuentan como jornada.
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

// Cuántas tareas extra de la jornada ya sumaron puntos (nunca más que el tope diario)
export const extrasPagas = (j) => Math.min(Object.values(j?.premiosExtra ?? {}).filter(Boolean).length, MAX_EXTRAS_DIA);

// Los puntos de una jornada, separados por momento del día: abrir la planta, desafío, cerrar la planta, Ed. Física y extras
export function puntosDetalleJornada(j) {
  const apertura = j?.premioChecklist ? PUNTOS_CHECKLIST : 0;
  const desafio = j?.desafioAprobado ? PUNTOS_DESAFIO : 0;
  const cierre = j?.premioCierre ? PUNTOS_CIERRE : 0;
  const edFisica = j?.premioEdFisica ? PUNTOS_EDFISICA : 0;
  const extras = extrasPagas(j) * PUNTOS_EXTRA;
  return { apertura, desafio, cierre, edFisica, extras, total: apertura + desafio + cierre + edFisica + extras };
}

export const puntosDeJornada = (j) => puntosDetalleJornada(j).total;

// Lo máximo que puede sumar una jornada: lo común (35) + Ed. Física si le toca + las extra que haya (hasta el tope)
export const maximoDeJornada = ({ edFisica = false, extras = 0 } = {}) =>
  PUNTOS_JORNADA + (edFisica ? PUNTOS_EDFISICA : 0) + Math.min(extras, MAX_EXTRAS_DIA) * PUNTOS_EXTRA;

// ¿La jornada tiene actividad del día común (checklist, desafío, asistencia, cierre o extras)? Un documento vacío, o con solo cosas de
// Ed. Física, no cuenta como jornada: así una pantalla abierta por error no le baja el promedio a un equipo.
export function tieneActividadComun(j) {
  const marcada = (mapa) => Object.entries(mapa ?? {}).some(([id, v]) => v === true && !id.startsWith('ef_'));
  return marcada(j?.declaradas) || marcada(j?.aprobadas)
    || !!j?.premioChecklist || !!j?.premioCierre || !!j?.desafioAprobado
    || j?.respuesta != null || j?.asistencia != null
    || extrasPagas(j) > 0;
}

// Puntos, bonos, jornadas y promedio por equipo para un conjunto de jornadas; determina el ganador.
// diasSinClase (Set de fechas): sus jornadas no cuentan, así el feriado no baja el promedio de nadie.
// `puntos` es el total del equipo (jornadas + bonos, lo mismo que suma la tabla de posiciones). El promedio es por jornada y SIN bonos:
// puntos de las jornadas (abrir, desafío, cerrar, Ed. Física y extras) dividido la cantidad de jornadas con actividad del día común.
// Los puntos de Ed. Física de un equipo que no tuvo ese día como jornada propia suman, pero no cuentan como una jornada más.
export function resumenTurnos(jornadas, { bonos = [], diasSinClase } = {}) {
  const r = Object.fromEntries(TURNOS.map((t) => [t.id, { ...t, puntos: 0, bonos: 0, jornadas: 0 }]));
  for (const j of jornadas) {
    if (diasSinClase?.has(j.fecha)) continue;
    const turno = ALUMNOS.find((a) => a.id === j.jefeId)?.turno;
    if (!r[turno]) continue;
    r[turno].puntos += puntosDeJornada(j);
    if (tieneActividadComun(j)) r[turno].jornadas += 1;
  }
  for (const b of bonos) {
    if (!r[b.turnoId]) continue;
    r[b.turnoId].puntos += b.puntos;
    r[b.turnoId].bonos += b.puntos;
  }
  // Un equipo sin ninguna jornada en la semana (por ejemplo, su día fue feriado y no lo recuperó) no compite por el premio.
  // Sus puntos de Ed. Física o sus bonos igual suman en `puntos`.
  const lista = Object.values(r).map((t) => ({
    ...t,
    compite: t.jornadas > 0,
    promedio: t.jornadas === 0 ? 0 : (t.puntos - t.bonos) / t.jornadas,
  }));
  const clave = (t) => (CRITERIO_GANADOR === 'total' ? t.puntos - t.bonos : t.promedio);
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

// Equipos que cumplen el criterio de cada bono sugerido en esas jornadas (las de una semana), para que el docente decida:
//  semana-perfecta: todas sus jornadas con actividad tienen abrir la planta, desafío y cerrar la planta completos (y al menos una jornada)
//  cero-tardes: declaró asistencia al menos una vez y ninguna llegada tarde
// Devuelve { 'semana-perfecta': ['e1', ...], 'cero-tardes': [...] }. Es una ayuda: el bono lo elige y lo carga el docente.
export function equiposCalificados(jornadas, diasSinClase) {
  const por = Object.fromEntries(TURNOS.map((t) => [t.id, []]));
  for (const j of jornadas) {
    if (diasSinClase?.has(j.fecha)) continue;
    const turno = ALUMNOS.find((a) => a.id === j.jefeId)?.turno;
    if (por[turno]) por[turno].push(j);
  }
  const perfecta = [];
  const ceroTardes = [];
  for (const [id, js] of Object.entries(por)) {
    const activas = js.filter(tieneActividadComun);
    if (activas.length > 0 && activas.every((j) => j.premioChecklist && j.premioCierre && j.desafioAprobado)) perfecta.push(id);
    const conAsistencia = js.filter((j) => j.asistencia);
    if (conAsistencia.length > 0 && conAsistencia.every((j) => j.asistencia.tardes === 0)) ceroTardes.push(id);
  }
  return { 'semana-perfecta': perfecta, 'cero-tardes': ceroTardes };
}

// Un resumen por cada semana que tenga jornadas o bonos, de la más vieja a la más nueva
export function resumenPorSemana(jornadas, bonos, diasSinClase) {
  const lunes = [...new Set([...jornadas.map((j) => lunesDe(j.fecha)), ...bonos.map((b) => lunesDe(b.fecha))])].sort();
  return lunes.map((l) => ({
    lunes: l,
    ...resumenTurnos(
      jornadas.filter((j) => lunesDe(j.fecha) === l),
      { bonos: bonos.filter((b) => lunesDe(b.fecha) === l), diasSinClase }
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
