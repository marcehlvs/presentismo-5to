import { Gift } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, etiquetaSemana } from '../lib/semanas';

export default function PremioSemana() {
  const { semana, premioSemana, resumenSemana, bonosSemana } = usePlant();
  const { lista, ganador, empate } = resumenSemana;
  const hayPuntos = lista.some((t) => t.puntos > 0);

  return (
    <section aria-labelledby="titulo-premio" className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="size-7" aria-hidden="true" />
        <h2 id="titulo-premio" className="font-display text-3xl font-bold">Premio de la semana</h2>
      </div>
      <p className="text-sm text-acero/70 mb-3">{etiquetaSemana(semana)}</p>
      <p className="font-semibold text-lg">{premioSemana?.texto ?? 'El docente todavía no cargó el premio de esta semana.'}</p>

      {hayPuntos && (ganador || empate) && (
        <p className="mt-3 font-medium">{ganador ? `Va ganando: ${ganador.nombre}` : 'Los primeros puestos van empatados'}</p>
      )}
      <ul className="mt-2 space-y-1 text-sm">
        {lista.map((t) => (
          <li key={t.id} className="flex flex-wrap justify-between gap-x-2">
            <span>{t.nombre}</span>
            <span className="tabular-nums">
              {t.puntos} pts{t.bonos > 0 ? ` (${t.bonos} de bono)` : ''} · {t.jornadas === 0 ? 'sin jornada' : `${t.jornadas} ${t.jornadas === 1 ? 'jornada' : 'jornadas'}`}
            </span>
          </li>
        ))}
      </ul>
      {bonosSemana.length > 0 && (
        <div className="mt-3">
          <h3 className="font-semibold text-sm">Bonos de la semana</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {bonosSemana.map((b) => (
              <li key={b.id}>
                <b className="tabular-nums">+{b.puntos}</b> {TURNOS.find((t) => t.id === b.turnoId)?.nombre}: {b.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs text-acero/60">
        {CRITERIO_GANADOR === 'promedio' ? 'Gana el equipo con más puntos por jornada.' : 'Gana el equipo con más puntos.'}
      </p>
    </section>
  );
}
