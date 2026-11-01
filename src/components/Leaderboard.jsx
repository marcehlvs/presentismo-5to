import { Trophy } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

export default function Leaderboard() {
  const { ranking, jefe, alumnos } = usePlant();
  const maximo = ranking[0]?.puntos || 1;

  return (
    <section aria-labelledby="titulo-ranking" className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="size-7 text-seguridad" strokeWidth={2.5} aria-hidden="true" />
        <h2 id="titulo-ranking" className="font-display text-3xl font-bold">Tabla de posiciones</h2>
      </div>

      <ol className="space-y-3">
        {ranking.map((t, i) => {
          const esMio = jefe?.turno === t.id;
          const lider = alumnos.find((a) => a.turno === t.id);
          return (
            <li
              key={t.id}
              className={`rounded-md border-2 p-3 ${esMio ? 'border-seguridad bg-seguridad/15' : 'border-acero/15'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="font-display text-2xl w-6">{i + 1}</span>
                  {t.nombre}
                  {esMio && <span className="text-sm font-medium text-acero/70">(tu equipo)</span>}
                </span>
                <span className="font-display text-2xl font-bold tabular-nums">{t.puntos} pts</span>
              </div>
              {lider && <p className="text-sm text-acero/70 pl-8">{lider.avatar ? `${lider.avatar} ` : ''}Líder: {lider.nombre} · {lider.dia}</p>}
              <div className="h-1.5 bg-hormigon rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-acero transition-all duration-500"
                  style={{ width: `${(t.puntos / maximo) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-acero/60">
        Puntos acumulados desde el inicio: los días con Ed. Física pueden sumar 10 más. El ganador de la semana se define aparte, por puntos por jornada común.
      </p>
    </section>
  );
}
