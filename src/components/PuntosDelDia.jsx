import { usePlant } from '../context/PlantContext';
import { maximoDeJornada, puntosDetalleJornada } from '../lib/semanas';

// Los puntos que lleva el equipo hoy, momento por momento: abrir la planta, desafío, cerrar la planta, Ed. Física y extras.
export default function PuntosDelDia() {
  const { jornadaActual, edFisicaMia, extras, maxExtras, puntosExtra, puntosChecklist, puntosCierre, puntosDesafio, puntosEdFisica, nuevoModelo, extrasPagasHoy } = usePlant();
  const d = puntosDetalleJornada(jornadaActual);
  const filas = [
    ['Abrir la planta', d.apertura, puntosChecklist],
    ['Desafío del día', d.desafio, puntosDesafio],
    ['Cerrar la planta', d.cierre, puntosCierre],
    ...(edFisicaMia ? [['Educación Física', d.edFisica, puntosEdFisica]] : []),
    ...(nuevoModelo && extras.length > 0 ? [[`Tareas extra (${extrasPagasHoy} de ${maxExtras})`, d.extras, maxExtras * puntosExtra]] : []),
  ];
  const maximo = maximoDeJornada({ edFisica: edFisicaMia, extras: nuevoModelo ? Math.min(extras.length, maxExtras) : 0 });
  return (
    <section aria-labelledby="titulo-puntos-dia" className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 id="titulo-puntos-dia" className="font-display text-3xl font-bold mb-3">Puntos de hoy</h2>
      <ul className="divide-y divide-acero/15">
        {filas.map(([nombre, ganados, posibles]) => (
          <li key={nombre} className="flex items-center justify-between gap-3 py-2">
            <span className={ganados ? 'font-semibold' : 'text-acero/70'}>{nombre}</span>
            <span className={`tabular-nums font-semibold ${ganados ? 'text-operativa' : 'text-acero/60'}`}>{ganados} / {posibles}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-between border-t-2 border-acero pt-3 font-display text-2xl font-bold">
        <span>Total del día</span>
        <span className="tabular-nums">{d.total} / {maximo}</span>
      </p>
      <p className="mt-2 text-sm text-acero/70">Los puntos se suman cuando el docente aprueba.</p>
    </section>
  );
}
