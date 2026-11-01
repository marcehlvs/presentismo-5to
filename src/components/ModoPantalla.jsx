import { useEffect, useState } from 'react';
import { Gift, Maximize, Trophy, WifiOff } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, etiquetaDia, etiquetaSemana } from '../lib/semanas';
import AvisoSinClase from './AvisoSinClase';

// Mientras la pantalla está abierta, pide que el equipo no se apague (si el navegador lo permite)
function useMantenerEncendida() {
  useEffect(() => {
    let candado = null;
    const pedir = async () => {
      try { candado = await navigator.wakeLock?.request('screen'); } catch { /* no disponible */ }
    };
    const alVolver = () => { if (document.visibilityState === 'visible') pedir(); };
    pedir();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      candado?.release?.().catch(() => {});
    };
  }, []);
}

function useConectado() {
  const [ok, setOk] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOk(true);
    const off = () => setOk(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return ok;
}

const MEDALLA = ['bg-seguridad text-acero', 'bg-hormigon text-acero', 'bg-[#c98a4b] text-acero'];

// Vista para la pantalla interactiva del aula: ranking y premio en grande. Se actualiza sola (Firestore en tiempo real).
export default function ModoPantalla() {
  const { ranking, semana, premioSemana, resumenSemana, bonosSemana, fecha, jornada, alumnos, hoyEdFisica } = usePlant();
  const conectado = useConectado();
  useMantenerEncendida();
  const maximo = ranking[0]?.puntos || 1;
  const { lista, ganador, empate } = resumenSemana;
  const hayPuntos = lista.some((t) => t.puntos > 0);

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <main className="min-h-screen lg:h-screen lg:overflow-hidden bg-acero text-white flex flex-col">
      <div className="franja-peligro h-4 shrink-0" />
      <header className="flex flex-wrap items-center justify-between gap-4 px-[3vw] pt-[2vh]">
        <div>
          <h1 className="font-display text-[clamp(1.75rem,min(4vw,7vh),4.5rem)] font-bold leading-none">Operación: Jefe de Planta</h1>
          <p className="mt-1 text-[clamp(0.9rem,min(1.5vw,2.6vh),1.6rem)] text-white/75">{jornada.diaNombre} · {etiquetaDia(fecha)}{hoyEdFisica ? ' · Hoy hay Educación Física' : ''}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span role="status" className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-semibold ${conectado ? 'bg-operativa text-white' : 'bg-alarma text-white'}`}>
            {conectado ? <><span className="size-2.5 rounded-full bg-white" aria-hidden="true" />En vivo</> : <><WifiOff className="size-4" aria-hidden="true" />Sin conexión</>}
          </span>
          <button onClick={pantallaCompleta} className="flex items-center gap-1.5 rounded-md border border-white/40 px-3 py-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60">
            <Maximize className="size-4" aria-hidden="true" />Pantalla completa
          </button>
          <a href="/" className="text-white/60 underline hover:text-white">Salir</a>
        </div>
      </header>

      <AvisoSinClase className="mx-[3vw] mt-4" />

      <div className="flex-1 min-h-0 grid gap-[2vw] px-[3vw] py-[2vh] lg:grid-cols-[3fr_2fr] items-stretch">
        <section aria-labelledby="pantalla-ranking" className="flex min-h-0 flex-col rounded-lg bg-white p-[1.6vw] text-acero">
          <div className="mb-[2vh] flex items-center gap-3">
            <Trophy className="size-[clamp(1.75rem,3vw,3rem)] text-seguridad" strokeWidth={2.5} aria-hidden="true" />
            <h2 id="pantalla-ranking" className="font-display text-[clamp(1.5rem,min(3vw,5vh),3.2rem)] font-bold leading-none">Tabla de posiciones</h2>
          </div>
          <ol className="flex min-h-0 flex-1 flex-col gap-[1.2vh]">
            {ranking.map((t, i) => {
              const l = alumnos.find((a) => a.turno === t.id);
              return (
                <li key={t.id} className="flex min-h-0 flex-1 flex-col justify-center rounded-md border-2 border-acero/15 px-[1.2vw]">
                  <div className="flex items-center gap-[1.2vw]">
                    <span className={`grid size-[clamp(2.25rem,min(4vw,7vh),4.5rem)] shrink-0 place-items-center rounded-full font-display text-[clamp(1.25rem,min(2.6vw,4.4vh),2.8rem)] font-bold ${MEDALLA[i] ?? 'bg-acero/10'}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-[clamp(1.25rem,min(2.6vw,4.4vh),2.8rem)] font-bold leading-tight">{t.nombre}</p>
                      {l && <p className="text-[clamp(0.8rem,min(1.2vw,2vh),1.2rem)] text-acero/70">{l.avatar ? `${l.avatar} ` : ''}Líder: {l.nombre} · {l.dia}</p>}
                    </div>
                    <p className="font-display text-[clamp(1.5rem,min(3.4vw,6vh),3.6rem)] font-bold tabular-nums leading-none">{t.puntos}<span className="ml-1 text-[0.45em] font-semibold">pts</span></p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-hormigon">
                    <div className="h-full bg-acero transition-all duration-700" style={{ width: `${Math.max((t.puntos / maximo) * 100, 0)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-[1.2vh] shrink-0 text-[clamp(0.7rem,0.95vw,0.95rem)] text-acero/60">
            Puntos acumulados desde el inicio. El ganador de la semana se define por puntos por jornada común.
          </p>
        </section>

        <section aria-labelledby="pantalla-premio" className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-seguridad p-[1.6vw] text-acero">
          <div className="mb-[1vh] flex items-center gap-3">
            <Gift className="size-[clamp(1.75rem,3vw,3rem)]" aria-hidden="true" />
            <h2 id="pantalla-premio" className="font-display text-[clamp(1.5rem,min(3vw,5vh),3.2rem)] font-bold leading-none">Premio de la semana</h2>
          </div>
          <p className="text-[clamp(0.9rem,1.3vw,1.3rem)] font-medium">{etiquetaSemana(semana)}</p>
          <p className="mt-[2vh] font-display text-[clamp(1.75rem,min(4.4vw,8vh),4.8rem)] font-bold leading-[1.05]">
            {premioSemana?.texto ?? 'El docente todavía no cargó el premio de esta semana.'}
          </p>

          {hayPuntos && (ganador || empate) && (
            <p className="mt-[2vh] rounded-md bg-acero px-4 py-2 font-display text-[clamp(1.25rem,2.2vw,2.2rem)] font-bold text-seguridad">
              {ganador ? `Va ganando: ${ganador.nombre}` : 'Los primeros puestos van empatados'}
            </p>
          )}

          <ul className="mt-[2vh] space-y-1 text-[clamp(0.95rem,1.4vw,1.4rem)]">
            {lista.map((t) => (
              <li key={t.id} className="flex justify-between gap-3">
                <span className="font-semibold">{t.nombre}</span>
                <span className="tabular-nums">{t.puntos} pts{t.jornadas === 0 ? ' · sin jornada' : ''}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[clamp(0.75rem,1vw,1rem)] text-acero/75">
            {CRITERIO_GANADOR === 'promedio' ? 'Gana el equipo con más puntos por jornada.' : 'Gana el equipo con más puntos.'}
          </p>

          {bonosSemana.length > 0 && (
            <ul className="mt-auto space-y-1 pt-[2vh] text-[clamp(0.85rem,1.2vw,1.2rem)]">
              {bonosSemana.map((b) => (
                <li key={b.id}><b className="tabular-nums">+{b.puntos}</b> {TURNOS.find((t) => t.id === b.turnoId)?.nombre}: {b.motivo}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
