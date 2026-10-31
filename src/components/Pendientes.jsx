import { usePlant } from '../context/PlantContext';
import { DIAS_PENDIENTES, pendientesDe } from '../lib/pendientes';
import { etiquetaDia, sumarDias } from '../lib/semanas';
import FilaTareaDocente from './FilaTareaDocente';
import RevisionDesafio from './RevisionDesafio';

// Jornadas de días anteriores que quedaron con tareas marcadas o respuestas sin revisar.
// Sin esta bandeja, lo que no se aprobaba el mismo día quedaba sin puntos para siempre.
export default function Pendientes() {
  const { fecha, historial, alumnosEn, sinClaseDe, tareasEn } = usePlant();

  const desde = sumarDias(fecha, -DIAS_PENDIENTES);
  const lista = historial
    .filter((j) => j.fecha < fecha && j.fecha >= desde && !sinClaseDe(j.fecha))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || a.jefeId - b.jefeId)
    .map((j) => ({ j, p: pendientesDe(j, tareasEn(j.fecha)) }))
    .filter((x) => x.p.hay);

  if (lista.length === 0) return null;

  return (
    <section aria-labelledby="titulo-pendientes" className="bg-white border-2 border-alarma rounded-lg p-5">
      <h2 id="titulo-pendientes" className="font-display text-3xl font-bold mb-1">Pendientes de días anteriores ({lista.length})</h2>
      <p className="text-sm text-acero/70 mb-3">
        Tareas que el equipo marcó o respuestas que envió y nadie aprobó. Al aprobarlas se suman los puntos al equipo (últimos {DIAS_PENDIENTES} días).
      </p>
      <div className="space-y-4">
        {lista.map(({ j, p }) => {
          const alumno = alumnosEn(j.fecha).find((a) => a.id === j.jefeId);
          return (
            <div key={j.id} className="rounded-md border-2 border-acero/20 p-3">
              <h3 className="font-display text-xl font-bold mb-2">
                {etiquetaDia(j.fecha)} · {alumno?.nombre ?? `Jefe ${j.jefeId}`}
              </h3>
              {p.tareas.length > 0 && (
                <ul className="space-y-2">
                  {p.tareas.map((t) => <FilaTareaDocente key={t.id} j={j} t={t} />)}
                </ul>
              )}
              {p.desafio && <RevisionDesafio j={j} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
