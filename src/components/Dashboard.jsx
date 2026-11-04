import { HardHat, CalendarDays, Power, LogOut } from 'lucide-react';
import Avatar from './Avatar';
import Creditos from './Creditos';
import { usePlant } from '../context/PlantContext';
import Checklist from './Checklist';
import { equipoDe } from '../data/mockData';
import QualityControl from './QualityControl';
import Leaderboard from './Leaderboard';
import PremioSemana from './PremioSemana';
import AvisoSinClase from './AvisoSinClase';
import PuntosDelDia from './PuntosDelDia';

export default function Dashboard() {
  const { jefe, jornada, plantaOperativa, plantaCerrada, cerrarTurno, suplenteHoy, hoyEdFisica, edFisicaMia, nuevoModelo, extras, extrasPagasHoy, maxExtras, puntosExtra, sorteoHoy, alumnos, puntosEdFisica } = usePlant();
  const equipo = equipoDe(jefe);

  return (
    <div className="min-h-screen">
      <header className="bg-acero text-white">
        <div className="franja-peligro h-3" />
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {jefe.avatar ? (
              <Avatar emoji={jefe.avatar} className="size-14 text-4xl" />
            ) : (
              <span className="size-12 rounded-full bg-seguridad text-acero flex items-center justify-center shrink-0">
                <HardHat className="size-7" aria-hidden="true" />
              </span>
            )}
            <div>
              <p className="font-display text-3xl font-bold leading-none">{jefe.nombre}</p>
              <p className="flex items-center gap-1.5 text-white/75 mt-1">
                <CalendarDays className="size-4" aria-hidden="true" />
                {jornada.diaNombre} · Líder de {equipo?.nombre}{suplenteHoy ? ` · Suplente: ${suplenteHoy}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              role="status"
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-display text-2xl font-bold ${
                plantaCerrada ? 'bg-seguridad text-acero' : plantaOperativa ? 'bg-operativa text-white' : 'bg-white/10 text-white/80 border border-white/30'
              }`}
            >
              <Power className="size-5" aria-hidden="true" />
              {plantaCerrada ? 'Planta Cerrada' : plantaOperativa ? 'Planta Operativa' : 'Planta Inactiva'}
            </span>
            <button
              onClick={cerrarTurno}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/40 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Cerrar turno
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <AvisoSinClase className="lg:col-span-2" />
        <div className="space-y-6">
          <Checklist momento="apertura" titulo="Checklist matutino" />
          <QualityControl />
          {edFisicaMia && (
            <Checklist
              momento="edfisica" titulo="Educación Física"
              ayuda={`Hoy hay Ed. Física, fuera del aula, y les tocó a ustedes: suman ${puntosEdFisica} puntos. Marcá cada paso a medida que lo hacés; el docente lo aprueba.`}
            />
          )}
          {hoyEdFisica && !edFisicaMia && nuevoModelo && (
            <p role="status" className="bg-white border-2 border-acero rounded-lg p-4 font-semibold">
              {sorteoHoy
                ? `Hoy la Educación Física la hace el equipo de ${alumnos.find((a) => a.id === sorteoHoy.jefeId)?.nombre ?? 'otro líder'}. Ustedes pueden sumar con las tareas extra.`
                : 'Hoy hay Educación Física: el docente sortea qué equipo la hace. Mientras tanto, ¡sumen con las tareas extra!'}
            </p>
          )}
          <Checklist momento="cierre" titulo="Cierre de planta" />
          {nuevoModelo && extras.length > 0 && (
            <Checklist
              momento="extra" titulo="Tareas extra"
              ayuda={`Son opcionales: cada una aprobada suma +${puntosExtra} (hasta ${maxExtras} por día). Llevan ${extrasPagasHoy} de ${maxExtras}.`}
            />
          )}
        </div>
        <div className="space-y-6">
          <PuntosDelDia />
          <Leaderboard />
          <PremioSemana />
        </div>
      </main>
      <Creditos className="pb-6" />
    </div>
  );
}
