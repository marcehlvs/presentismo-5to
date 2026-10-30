import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, etiquetaDia, etiquetaSemana, lunesDe, puntosDeJornada, resumenTurnos, sumarDias } from '../lib/semanas';
import { btn, campo } from './estilos';

const fechaLarga = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const th = 'border border-black/50 bg-black/5 px-2 py-1 text-left font-semibold';
const td = 'border border-black/40 px-2 py-1 tabular-nums';

// La hoja que se imprime: en blanco y negro, pensada para A4
export function HojaResumen({ d, alumnosEn }) {
  const { lunes, jornadas, bonos, dias, premio, resumen, esActual, sinClase, edFisica } = d;
  const lideres = alumnosEn(lunes);
  const liderDe = (turno) => lideres.find((a) => a.turno === turno)?.nombre ?? '';
  const conAsistencia = jornadas.filter((j) => !sinClase.has(j.fecha) && j.asistencia);
  const tardes = conAsistencia.reduce((n, j) => n + j.asistencia.tardes, 0);
  const presentes = conAsistencia.length
    ? Math.round((conAsistencia.reduce((n, j) => n + j.asistencia.presentes, 0) / conAsistencia.length) * 10) / 10
    : null;
  const sinClaseSemana = dias.filter((x) => x.sinClase);

  return (
    <div className="bg-white p-6 text-[13px] leading-snug text-black">
      <div className="flex items-end justify-between gap-4 border-b-2 border-black pb-2">
        <div>
          <p className="font-display text-3xl font-bold leading-none">Operación: Jefe de Planta</p>
          <p className="mt-1 text-base font-semibold">Resumen semanal · {fechaLarga(lunes)} al {fechaLarga(sumarDias(lunes, 4))}{esActual ? ' (semana en curso)' : ''}</p>
        </div>
        <p className="text-xs">Impreso el {fechaLarga(new Date().toLocaleDateString('en-CA'))}</p>
      </div>

      <p className="mt-3 text-base">
        {resumen.ganador
          ? <>{esActual ? 'Va ganando' : 'Equipo ganador'}: <b>{resumen.ganador.nombre}</b> (líder: {liderDe(resumen.ganador.id)})</>
          : resumen.empate ? <b>Los primeros puestos están empatados.</b> : <b>Todavía no hay equipo ganador.</b>}
        {premio && <> · Premio: <b>{premio}</b></>}
      </p>

      <table className="mt-3 w-full border-collapse">
        <thead><tr><th className={th}>#</th><th className={th}>Equipo</th><th className={th}>Líder</th><th className={th}>Puntos</th><th className={th}>Bonos</th><th className={th}>Jornadas</th><th className={th}>Promedio</th></tr></thead>
        <tbody>
          {resumen.lista.map((t, i) => (
            <tr key={t.id}>
              <td className={td}>{i + 1}</td><td className={td}>{t.nombre}</td><td className={td}>{liderDe(t.id)}</td>
              <td className={td}>{t.puntos}</td><td className={td}>{t.bonos}</td><td className={td}>{t.jornadas}</td><td className={td}>{t.promedio.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs">
        {CRITERIO_GANADOR === 'promedio' ? 'Gana el equipo con más puntos por jornada' : 'Gana el equipo con más puntos'} (los puntos incluyen los bonos). Los días sin clase no cuentan.
      </p>

      <p className="mt-4 font-display text-xl font-bold">Detalle por día</p>
      <table className="mt-1 w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Día</th><th className={th}>Líder</th><th className={th}>Matutino</th><th className={th}>Desafío</th>
            <th className={th}>Ed. Física</th><th className={th}>Cierre</th><th className={th}>Puntos</th><th className={th}>Presentes</th><th className={th}>Tarde</th>
          </tr>
        </thead>
        <tbody>
          {jornadas.length === 0 && <tr><td className={td} colSpan={9}>No hay jornadas registradas esta semana.</td></tr>}
          {jornadas.map((j) => {
            const suplente = dias.find((x) => x.fecha === j.fecha)?.suplentes?.[String(j.jefeId)];
            const sin = sinClase.has(j.fecha);
            const sn = (v) => (sin ? '–' : v ? 'Sí' : 'No');
            return (
              <tr key={j.id}>
                <td className={td}>{etiquetaDia(j.fecha)}</td>
                <td className={td}>{alumnosEn(j.fecha).find((a) => a.id === j.jefeId)?.nombre ?? `Jefe ${j.jefeId}`}{suplente ? ` (suplente: ${suplente})` : ''}</td>
                <td className={td}>{sn(j.premioChecklist)}</td>
                <td className={td}>{sn(j.desafioAprobado)}</td>
                <td className={td}>{sin || !edFisica.has(j.fecha) ? '–' : j.premioEdFisica ? 'Sí' : 'No'}</td>
                <td className={td}>{sn(j.premioCierre)}</td>
                <td className={td}>{sin ? 'sin clase' : puntosDeJornada(j)}</td>
                <td className={td}>{j.asistencia?.presentes ?? '–'}</td>
                <td className={td}>{j.asistencia?.tardes ?? '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-xs">“–” significa que ese día no corresponde (sin clase o sin Ed. Física).</p>

      <div className="mt-3 space-y-1">
        {presentes !== null && <p>Asistencia: promedio de <b>{presentes}</b> presentes por día y <b>{tardes}</b> {tardes === 1 ? 'llegada tarde' : 'llegadas tarde'} en la semana.</p>}
        {sinClaseSemana.length > 0 && (
          <p>Sin clase: {sinClaseSemana.map((x) => `${etiquetaDia(x.fecha)}${x.motivo ? ` (${x.motivo})` : ''}`).join(', ')}.</p>
        )}
        {bonos.length > 0 && (
          <div>
            <p className="font-semibold">Bonos de la semana</p>
            <ul className="list-disc pl-5">
              {bonos.map((b) => <li key={b.id}>+{b.puntos} {TURNOS.find((t) => t.id === b.turnoId)?.nombre} · {b.motivo} · {etiquetaDia(b.fecha)}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Elegís la semana, la ves acá y la imprimís (o la guardás como PDF desde el cuadro de impresión)
export default function ResumenSemanal() {
  const { historial, bonosTodos, diasTodos, premios, sinClaseTodos, edFisicaTodos, semana, alumnosEn } = usePlant();
  const [sel, setSel] = useState(semana);

  const semanas = useMemo(
    () => [...new Set([semana, ...historial.map((j) => lunesDe(j.fecha)), ...bonosTodos.map((b) => lunesDe(b.fecha))])].sort().reverse(),
    [semana, historial, bonosTodos]
  );

  const d = useMemo(() => {
    const jornadas = historial.filter((j) => lunesDe(j.fecha) === sel).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.jefeId - b.jefeId);
    const bonos = bonosTodos.filter((b) => lunesDe(b.fecha) === sel).sort((a, b) => a.fecha.localeCompare(b.fecha));
    return {
      lunes: sel, esActual: sel === semana, jornadas, bonos,
      dias: diasTodos.filter((x) => lunesDe(x.fecha) === sel),
      premio: premios.find((p) => p.id === sel)?.texto,
      resumen: resumenTurnos(jornadas, { bonos, diasSinClase: sinClaseTodos, diasEdFisica: edFisicaTodos }),
      sinClase: sinClaseTodos, edFisica: edFisicaTodos,
    };
  }, [sel, semana, historial, bonosTodos, diasTodos, premios, sinClaseTodos, edFisicaTodos]);

  return (
    <>
      <section className="bg-white border-2 border-acero rounded-lg p-5">
        <h2 className="font-display text-3xl font-bold mb-1">Resumen semanal para imprimir</h2>
        <p className="text-sm text-acero/70 mb-3">Una hoja A4 con la tabla de posiciones, el detalle por día y los bonos. En el cuadro de impresión también podés elegir “Guardar como PDF”.</p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block sm:w-64">
            <span className="block text-sm font-medium mb-1">Semana</span>
            <select value={sel} onChange={(e) => setSel(e.target.value)} className={campo}>
              {semanas.map((l) => <option key={l} value={l}>{etiquetaSemana(l)}{l === semana ? ' (en curso)' : ''}</option>)}
            </select>
          </label>
          <button onClick={() => window.print()} className={`${btn} flex items-center gap-1.5 bg-acero text-seguridad`}>
            <Printer className="size-4" aria-hidden="true" />Imprimir o guardar PDF
          </button>
        </div>
        <div className="overflow-x-auto rounded-md border-2 border-acero/20"><HojaResumen d={d} alumnosEn={alumnosEn} /></div>
      </section>
      {createPortal(<div className="solo-impresion"><HojaResumen d={d} alumnosEn={alumnosEn} /></div>, document.body)}
    </>
  );
}
