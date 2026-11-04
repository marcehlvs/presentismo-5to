import { usePlant } from '../context/PlantContext';
import { TURNOS } from '../data/mockData';

const nombreEquipo = (id) => TURNOS.find((t) => t.id === id)?.nombre ?? id;
const cuando = (m) => m.creado?.toDate?.().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) ?? 'recién';

// Registro de cada cambio del contador de puntos: si un total no cierra, acá se ve cuándo, cuánto y por qué cambió.
export default function Movimientos() {
  const { movimientos } = usePlant();
  return (
    <section aria-labelledby="titulo-mov" className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 id="titulo-mov" className="font-display text-3xl font-bold mb-1">Últimos movimientos de puntos</h2>
      <p className="text-sm text-acero/70 mb-3">Cada vez que cambia el contador de un equipo queda registrado (últimos 40).</p>
      {movimientos.length === 0 ? (
        <p className="text-acero/70">Todavía no hay movimientos registrados.</p>
      ) : (
        <ul className="divide-y divide-acero/15 text-sm">
          {movimientos.map((m) => (
            <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 py-1.5">
              <span className="tabular-nums text-acero/70">{cuando(m)}</span>
              <span className="font-semibold">{nombreEquipo(m.turnoId)}</span>
              <span className={`tabular-nums font-semibold ${m.delta < 0 ? 'text-alarma' : 'text-operativa'}`}>{m.delta > 0 ? '+' : ''}{m.delta}</span>
              <span className="min-w-0 break-words">{m.motivo}{m.jornada ? ` · ${m.jornada}` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
