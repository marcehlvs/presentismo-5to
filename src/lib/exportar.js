import { ALUMNOS, TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, crearDiasEdFisica, deIso, hoyISO, puntosDeJornada, resumenPorSemana } from './semanas';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const nombreEquipo = (id) => TURNOS.find((t) => t.id === id)?.nombre ?? id;
const liderBase = (id) => ALUMNOS.find((a) => a.id === Number(id));
const si = (v) => (v ? 'Sí' : 'No');
const enc = (texto) => ({ value: texto, fontWeight: 'bold' });
const fechaCelda = (iso) => ({ value: deIso(iso), type: Date, format: 'dd/mm/yyyy' });
const vacioNull = (v) => (v === '' || v == null ? null : v);

// Arma las hojas del libro a partir de lo que ya tiene cargado el panel docente (no consulta nada más)
export function armarHojas({ jornadas, bonos, dias, premios, alumnosEn, versionesEF = [] }) {
  const sinClase = new Set(dias.filter((d) => d.sinClase).map((d) => d.fecha));
  const edFisica = crearDiasEdFisica(dias, versionesEF);
  // El líder de cada fecha (los líderes pueden cambiar con el tiempo); sin la función, rige la lista de mockData.js
  const lider = (id, fecha) => (alumnosEn && fecha ? alumnosEn(fecha) : ALUMNOS).find((a) => a.id === Number(id)) ?? liderBase(id);
  const suplenteDe = (fecha, jefeId) => dias.find((d) => d.fecha === fecha)?.suplentes?.[String(jefeId)];

  const filasJornadas = [...jornadas]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.jefeId - b.jefeId)
    .map((j) => [
      fechaCelda(j.fecha),
      DIAS[deIso(j.fecha).getDay()],
      nombreEquipo(liderBase(j.jefeId)?.turno),
      lider(j.jefeId, j.fecha)?.nombre ?? `Jefe ${j.jefeId}`,
      vacioNull(suplenteDe(j.fecha, j.jefeId)),
      j.asistencia?.presentes ?? null,
      j.asistencia?.tardes ?? null,
      Object.values(j.aprobadas ?? {}).filter(Boolean).length,
      si(j.premioChecklist),
      si(j.premioCierre),
      sinClase.has(j.fecha) || !edFisica.has(j.fecha) ? null : si(j.premioEdFisica),
      si(j.desafioAprobado),
      puntosDeJornada(j),
      sinClase.has(j.fecha) ? 'No (día sin clase)' : 'Sí',
    ]);

  const filasSemanas = resumenPorSemana(jornadas, bonos, sinClase, edFisica)
    .reverse()
    .flatMap((s) => {
      const premio = premios.find((p) => p.id === s.lunes)?.texto ?? null;
      return s.lista.map((t) => [
        fechaCelda(s.lunes),
        t.nombre,
        t.puntos - t.bonos,
        t.bonos,
        t.puntos,
        t.jornadas,
        { value: Math.round(t.promedio * 10) / 10, format: '0.0' },
        s.ganador?.id === t.id ? 'Sí' : null,
        premio,
      ]);
    });

  const filasBonos = [...bonos]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((b) => [fechaCelda(b.fecha), nombreEquipo(b.turnoId), b.puntos, b.motivo]);

  const filasDias = [...dias]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .flatMap((d) => [
      ...(d.sinClase ? [[fechaCelda(d.fecha), 'Sin clase', vacioNull(d.motivo)]] : []),
      ...(d.edFisica ? [[fechaCelda(d.fecha), 'Ed. Física', null]] : []),
      ...Object.entries(d.suplentes ?? {}).map(([id, n]) => [fechaCelda(d.fecha), 'Suplente', `${n} (por ${lider(id, d.fecha)?.nombre ?? `Jefe ${id}`})`]),
    ]);

  const hoja = (nombre, cabeceras, filas, anchos) => ({
    sheet: nombre,
    data: [cabeceras.map(enc), ...filas],
    columns: anchos.map((width) => ({ width })),
    stickyRowsCount: 1,
  });

  return [
    hoja('Jornadas',
      ['Fecha', 'Día', 'Equipo', 'Jefe de Planta', 'Suplente', 'Presentes', 'Llegadas tarde', 'Tareas aprobadas', 'Checklist matutino completo', 'Cierre de planta completo', 'Ed. Física completa', 'Desafío aprobado', 'Puntos', 'Cuenta'],
      filasJornadas, [12, 12, 20, 18, 18, 11, 15, 17, 27, 25, 19, 16, 9, 20]),
    hoja('Semanas',
      ['Semana (lunes)', 'Equipo', 'Puntos de jornadas', 'Bonos', 'Puntos totales', 'Jornadas', CRITERIO_GANADOR === 'promedio' ? 'Promedio por jornada' : 'Promedio (referencia)', 'Ganador', 'Premio'],
      filasSemanas, [15, 20, 18, 8, 15, 10, 21, 9, 30]),
    hoja('Bonos', ['Fecha', 'Equipo', 'Puntos', 'Motivo'], filasBonos, [12, 20, 9, 40]),
    hoja('Días especiales', ['Fecha', 'Tipo', 'Detalle'], filasDias, [12, 12, 40]),
  ];
}

// Descarga el historial completo como planilla .xlsx (la librería se carga recién al exportar)
export async function exportarHistorial(datos) {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  await writeExcelFile(armarHojas(datos)).toFile(`historial-jefe-de-planta-${hoyISO()}.xlsx`);
}