import { HardHat, CalendarDays, Power, LogOut } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import Checklist from './Checklist';
import { equipoDe } from '../data/mockData';
import QualityControl from './QualityControl';
import Leaderboard from './Leaderboard';
import PremioSemana from './PremioSemana';

export default function Dashboard() {
  const { jefe, jornada, plantaOperativa, plantaCerrada, cerrarTurno } = usePlant();
  const equipo = equipoDe(jefe);

  return (
    <div className="min-h-screen">
      <header className="bg-acero text-white">
        <div className="franja-peligro h-3" />
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="size-12 rounded-full bg-seguridad text-acero flex items-center justify-center shrink-0">
              <HardHat className="size-7" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-3xl font-bold leading-none">{jefe.nombre}</p>
              <p className="flex items-center gap-1.5 text-white/75 mt-1">
                <CalendarDays className="size-4" aria-hidden="true" />
                {jornada.diaNombre} · Líder de {equipo?.nombre}
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

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-6">
          <Checklist momento="apertura" titulo="Checklist matutino" />
          <QualityControl />
          <Checklist momento="cierre" titulo="Cierre de planta" />
        </div>
        <div className="space-y-6">
          <Leaderboard />
          <PremioSemana />
        </div>
      </main>
    </div>
  );
}
