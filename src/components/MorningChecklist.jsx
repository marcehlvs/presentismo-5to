import { Timer, Wind, PackageCheck, Presentation, Cog, CircleCheck } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

const ICONOS = { Timer, Wind, PackageCheck, Presentation };

export default function MorningChecklist() {
  const { tareas, hechas, aprobadas, toggleTarea, plantaOperativa, puntosChecklist } = usePlant();
  const completadas = tareas.filter((t) => aprobadas[t.id]).length;

  return (
    <section aria-labelledby="titulo-checklist" className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 id="titulo-checklist" className="font-display text-3xl font-bold">Checklist matutino</h2>
        <span className="font-medium tabular-nums">{completadas} de {tareas.length} aprobadas</span>
      </div>

      <div
        className="h-2 bg-hormigon rounded-full overflow-hidden mb-5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={tareas.length}
        aria-valuenow={completadas}
      >
        <div
          className="h-full bg-operativa transition-all duration-300"
          style={{ width: `${(completadas / tareas.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {tareas.map((t) => {
          const Icono = ICONOS[t.icono];
          const hecha = !!hechas[t.id];
          const aprobada = !!aprobadas[t.id];
          return (
            <li key={t.id}>
              <label
                className={`flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-seguridad/60 ${
                  aprobada ? 'border-operativa bg-operativa/10' : hecha ? 'border-seguridad bg-seguridad/10' : 'border-acero/20 hover:border-acero'
                }`}
              >
                <input
                  type="checkbox"
                  checked={hecha}
                  onChange={() => toggleTarea(t.id)}
                  className="sr-only"
                />
                <span
                  className={`size-7 shrink-0 rounded-md border-2 flex items-center justify-center ${
                    aprobada ? 'bg-operativa border-operativa text-white' : hecha ? 'bg-seguridad border-seguridad text-acero' : 'border-acero bg-white'
                  }`}
                  aria-hidden="true"
                >
                  {(hecha || aprobada) && <CircleCheck className="size-5" />}
                </span>
                <Icono className="size-6 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block font-semibold ${aprobada ? 'line-through decoration-2' : ''}`}>{t.titulo}</span>
                  <span className="block text-sm text-acero/70">{t.detalle}</span>
                  {(hecha || aprobada) && (
                    <span className="block text-sm font-medium">
                      {aprobada ? 'Aprobada por el docente' : 'Esperando aprobación del docente'}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {plantaOperativa && (
        <div
          role="status"
          className="anim-exito mt-5 flex items-center gap-4 bg-operativa text-white rounded-md p-4"
        >
          <Cog className="anim-giro size-10 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-display text-2xl font-bold leading-tight">¡Planta operativa!</p>
            <p className="text-sm">Checklist aprobado. Tu turno suma {puntosChecklist} puntos.</p>
          </div>
        </div>
      )}
    </section>
  );
}
