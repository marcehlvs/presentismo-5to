import { Gift } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { CRITERIO_GANADOR, etiquetaSemana } from '../lib/semanas';

export default function PremioSemana() {
  const { semana, premioSemana, resumenSemana } = usePlant();
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
          <li key={t.id} className="flex justify-between gap-2">
            <span>{t.nombre}</span>
            <span className="tabular-nums">{t.puntos} pts · {t.jornadas} {t.jornadas === 1 ? 'jornada' : 'jornadas'}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-acero/60">
        {CRITERIO_GANADOR === 'promedio' ? 'Gana el equipo con más puntos por jornada.' : 'Gana el equipo con más puntos.'}
      </p>
    </section>
  );
}
