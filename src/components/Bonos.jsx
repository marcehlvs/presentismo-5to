import { useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { ALUMNOS, TURNOS } from '../data/mockData';
import { BONOS_SUGERIDOS, BONO_MAXIMO, etiquetaDia } from '../lib/semanas';
import { btn, campo } from './estilos';

const nombreEquipo = (id) => TURNOS.find((t) => t.id === id)?.nombre ?? id;
const momento = (b) => b.creado?.toMillis?.() ?? Number.MAX_SAFE_INTEGER; // recién creado: todavía sin hora del servidor

// Puntos extra que carga el docente (semana perfecta, cero llegadas tarde, etc.)
export default function Bonos() {
  const { fecha, cargarBono, quitarBono, bonosTodos, jornadasSemana, sinClaseTodos } = usePlant();
  const [f, setF] = useState({ turnoId: '', puntos: '', motivo: '', fecha });
  const [estado, setEstado] = useState('');
  const cambiar = (campoNombre, valor) => { setF((p) => ({ ...p, [campoNombre]: valor })); setEstado(''); };

  const puntos = Number(f.puntos);
  const valido = f.turnoId && Number.isInteger(puntos) && puntos >= 1 && puntos <= BONO_MAXIMO && f.motivo.trim() && f.fecha;

  // Ayuda para decidir "cero llegadas tarde": lo que declararon los líderes del equipo esta semana
  const tardes = useMemo(() => {
    if (!f.turnoId) return null;
    const js = jornadasSemana.filter(
      (j) => !sinClaseTodos.has(j.fecha) && j.asistencia && ALUMNOS.find((a) => a.id === j.jefeId)?.turno === f.turnoId
    );
    return { jornadas: js.length, tardes: js.reduce((n, j) => n + j.asistencia.tardes, 0) };
  }, [f.turnoId, jornadasSemana, sinClaseTodos]);

  const recientes = useMemo(
    () => [...bonosTodos].sort((a, b) => b.fecha.localeCompare(a.fecha) || momento(b) - momento(a)).slice(0, 10),
    [bonosTodos]
  );

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('');
    if (await cargarBono(f)) {
      setEstado('ok');
      setF((p) => ({ ...p, puntos: '', motivo: '' }));
    }
  };

  const quitar = (b) => {
    if (window.confirm(`¿Quitar el bono de +${b.puntos} para ${nombreEquipo(b.turnoId)}? Se restan esos puntos.`)) quitarBono(b);
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Bonos</h2>
      <p className="text-sm text-acero/70 mb-3">Puntos extra para un equipo. Suman a la tabla de posiciones y al ranking de la semana de la fecha elegida.</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {BONOS_SUGERIDOS.map((b) => (
          <button key={b.motivo} type="button" onClick={() => setF((p) => ({ ...p, motivo: b.motivo, puntos: String(b.puntos) }))} className={btn}>
            {b.motivo} (+{b.puntos})
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Equipo</span>
          <select value={f.turnoId} onChange={(e) => cambiar('turnoId', e.target.value)} className={campo}>
            <option value="">Elegí un equipo</option>
            {TURNOS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Fecha</span>
          <input type="date" value={f.fecha} onChange={(e) => cambiar('fecha', e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Puntos (1 a {BONO_MAXIMO})</span>
          <input type="number" inputMode="numeric" min="1" max={BONO_MAXIMO} value={f.puntos} onChange={(e) => cambiar('puntos', e.target.value)} className={campo} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Motivo</span>
          <input value={f.motivo} onChange={(e) => cambiar('motivo', e.target.value)} maxLength={80} placeholder="Ej: Semana perfecta" className={campo} />
        </label>
        {tardes && (
          <p className="sm:col-span-2 text-sm text-acero/70">
            Esta semana, {nombreEquipo(f.turnoId)} declaró {tardes.tardes} {tardes.tardes === 1 ? 'llegada tarde' : 'llegadas tarde'} en {tardes.jornadas} {tardes.jornadas === 1 ? 'jornada con asistencia' : 'jornadas con asistencia'}.
          </p>
        )}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button disabled={!valido} className={`${btn} bg-acero text-seguridad`}>Cargar bono</button>
          {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Bono cargado ✓</span>}
        </div>
      </form>

      <h3 className="font-display text-xl font-bold mt-5 mb-2">Últimos bonos</h3>
      {recientes.length === 0 ? (
        <p className="text-sm">Todavía no cargaste bonos.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {recientes.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3">
              <span><b className="tabular-nums">+{b.puntos}</b> {nombreEquipo(b.turnoId)} · {b.motivo} · {etiquetaDia(b.fecha)}</span>
              <button onClick={() => quitar(b)} className={`${btn} text-alarma border-alarma`}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
