import { usePlant } from '../context/PlantContext';
import { desafioDeFecha } from '../data/mockData';
import Leaderboard from './Leaderboard';

const btn = 'px-3 py-1.5 rounded-md border-2 border-acero font-semibold text-sm';

export default function PanelDocente() {
  const { jornadasHoy, alumnos, tareas, aprobarTarea, aprobarDesafio, rechazarDesafio, logoutDocente, jornada, error } = usePlant();

  return (
    <div className="min-h-screen">
      <header className="bg-acero text-white">
        <div className="franja-peligro h-3" />
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-bold leading-none">Panel docente</p>
            <p className="text-white/75 mt-1">{jornada.diaNombre}</p>
          </div>
          <button onClick={logoutDocente} className="px-3 py-2 rounded-md border border-white/40 hover:bg-white/10">Cerrar sesión</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-6">
          {error && <p role="alert" className="text-alarma font-semibold">{error}</p>}
          {jornadasHoy.length === 0 && (
            <p className="bg-white border-2 border-acero rounded-lg p-5">Todavía no hay actividad de Jefes de Planta hoy.</p>
          )}
          {jornadasHoy.map((j) => {
            const alumno = alumnos.find((a) => a.id === j.jefeId);
            const desafio = desafioDeFecha(j.fecha);
            const ap = j.aprobadas ?? {};
            const dec = j.declaradas ?? {};
            return (
              <section key={j.id} className="bg-white border-2 border-acero rounded-lg p-5">
                <h2 className="font-display text-3xl font-bold mb-3">{alumno?.nombre ?? `Jefe ${j.jefeId}`}</h2>
                <ul className="space-y-2">
                  {tareas.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-md border-2 border-acero/20">
                      <span>
                        <span className="block font-semibold">{t.titulo}</span>
                        <span className="block text-sm text-acero/70">{dec[t.id] ? 'Marcada por el alumno' : 'Sin marcar'}</span>
                      </span>
                      <button
                        onClick={() => aprobarTarea(j, t.id, !ap[t.id])}
                        className={`${btn} ${ap[t.id] ? 'bg-operativa text-white border-operativa' : ''}`}
                      >
                        {ap[t.id] ? 'Aprobada ✓' : 'Aprobar'}
                      </button>
                    </li>
                  ))}
                </ul>
                {j.premioChecklist && <p className="mt-2 text-sm text-operativa font-semibold">Checklist completo: puntos ya sumados al turno.</p>}

                <div className="mt-5 p-3 rounded-md border-2 border-acero/20">
                  <p className="font-semibold">Desafío: {desafio.enunciado}</p>
                  <p className="text-sm text-acero/70 mt-1">Respuesta correcta: {desafio.respuesta}</p>
                  <p className="mt-2">
                    Respuesta del alumno: <b>{j.respuesta ?? (j.desafioAprobado ? '(aprobada)' : 'sin enviar')}</b>
                  </p>
                  {j.desafioAprobado ? (
                    <p className="mt-2 text-operativa font-semibold">Aprobado: puntos ya sumados al turno.</p>
                  ) : (
                    j.respuesta != null && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => aprobarDesafio(j)} className={`${btn} bg-operativa text-white border-operativa`}>Aprobar</button>
                        <button onClick={() => rechazarDesafio(j)} className={`${btn} text-alarma border-alarma`}>Rechazar</button>
                      </div>
                    )
                  )}
                </div>
              </section>
            );
          })}
        </div>
        <Leaderboard />
      </main>
    </div>
  );
}
