// Feriados nacionales de Argentina que la app marca solos como "día sin clase" (no suman puntos ni cuentan como jornada).
//
// - Fuente: Ley 27.399 (feriados inamovibles y reglas de traslado) y el calendario oficial en argentina.gob.ar/feriados.
// - Solo están los feriados nacionales. Los "días no laborables" (por ejemplo el lunes 7/12/2026) y los puentes turísticos
//   no se precargan: cada escuela decide si hay clase, así que se marcan a mano desde "Días especiales".
// - Si ese día sí hay clase (o la escuela no adhiere), el docente toca "Hay clase este día" y queda solo para esa fecha.
// - Para 2027 faltan los días con fines turísticos (el Gobierno los fija por decreto hacia fines de 2026) y el eventual
//   traslado del 20/11/2027, que cae sábado: agregarlos acá cuando salgan, siempre ordenados por fecha.
//
// Las fechas anteriores a FERIADOS_DESDE no se tocan: las jornadas ya cargadas conservan su resultado.
export const FERIADOS_DESDE = '2026-11-02';

export const FERIADOS = [
  { fecha: '2026-11-23', motivo: 'Día de la Soberanía Nacional (trasladado del 20/11)' },
  { fecha: '2026-12-08', motivo: 'Inmaculada Concepción de María' },
  { fecha: '2026-12-25', motivo: 'Navidad' },
  // 2027 (según la Ley 27.399)
  { fecha: '2027-01-01', motivo: 'Año Nuevo' },
  { fecha: '2027-02-08', motivo: 'Carnaval' },
  { fecha: '2027-02-09', motivo: 'Carnaval' },
  { fecha: '2027-03-24', motivo: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { fecha: '2027-03-26', motivo: 'Viernes Santo' },
  { fecha: '2027-04-02', motivo: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { fecha: '2027-05-25', motivo: 'Día de la Revolución de Mayo' },
  { fecha: '2027-06-21', motivo: 'Paso a la Inmortalidad del Gral. Güemes (trasladado del 17/6)' },
  { fecha: '2027-07-09', motivo: 'Día de la Independencia' },
  { fecha: '2027-08-16', motivo: 'Paso a la Inmortalidad del Gral. San Martín (trasladado del 17/8)' },
  { fecha: '2027-10-11', motivo: 'Día del Respeto a la Diversidad Cultural (trasladado del 12/10)' },
  { fecha: '2027-12-08', motivo: 'Inmaculada Concepción de María' },
];

// El feriado de esa fecha (o null). Respeta FERIADOS_DESDE.
export const feriadoDe = (fecha) => (fecha >= FERIADOS_DESDE ? FERIADOS.find((f) => f.fecha === fecha) ?? null : null);
