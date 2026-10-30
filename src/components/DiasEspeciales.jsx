import { useEffect, useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { ALUMNOS, TURNOS, jefeDelDia } from '../data/mockData';
import { deIso, etiquetaDia, puntosDeJornada } from '../lib/semanas';
import { btn, campo } from './estilos';

const nombreLider = (id) => ALUMNOS.find((a) => a.id === Number(id))?.nombre ?? `Jefe ${id}`;

// Suplente del líder y días sin clase, cargados por fecha
export default function DiasEspeciales() {
  const { fecha, diasTodos, historial, designarSuplente, marcarSinClase } = usePlant();
  const [f, setF] = useState(fecha);
  const [lider, setLider] = useState('');
  const [suplente, setSuplente] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState('');

  const dia = diasTodos.find((d) => d.fecha === f);
  const suplenteActual = dia?.suplentes?.[lider] ?? '';
  const sinClase = !!dia?.sinClase;

  // Al cambiar la fecha, el líder por defecto es el de ese día de la semana
  useEffect(() => {
    if (!f) return;
    const l = jefeDelDia(deIso(f));
    setLider(l ? String(l.id) : '');
    setEstado('');
  }, [f]);
  useEffect(() => { setSuplente(suplenteActual); }, [suplenteActual, f, lider]);
  useEffect(() => { setMotivo(dia?.motivo ?? ''); }, [dia?.motivo, f]);

  // Si ya hay puntos ese día, marcarlo sin clase los saca del resumen semanal pero no de la tabla de posiciones
  const conPuntos = useMemo(
    () => historial.filter((j) => j.fecha === f && puntosDeJornada(j) > 0),
    [historial, f]
  );

  const lista = useMemo(
    () => [...diasTodos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 10),
    [diasTodos]
  );

  const correr = async (accion) => {
    setEstado('');
    setEstado((await accion()) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Suplentes y días sin clase</h2>
      <p className="text-sm text-acero/70 mb-3">Elegí la fecha y cargá lo que corresponda. Los alumnos lo ven en el inicio de la app.</p>

      <label className="block mb-4 sm:w-56">
        <span className="block text-sm font-medium mb-1">Fecha</span>
        <input type="date" value={f} onChange={(e) => setF(e.target.value)} className={campo} />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-3 rounded-md border-2 border-acero/20 space-y-3">
          <h3 className="font-display text-xl font-bold">Suplente del día</h3>
          <p className="text-sm text-acero/70">Si el líder falta, el suplente toma su turno y los puntos van igual al equipo del líder.</p>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Líder que falta</span>
            <select value={lider} onChange={(e) => setLider(e.target.value)} className={campo}>
              <option value="">Elegí un líder</option>
              {ALUMNOS.map((a) => (
                <option key={a.id} value={a.id}>{a.dia} · {a.nombre} · {TURNOS.find((t) => t.id === a.turno)?.nombre}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Nombre del suplente</span>
            <input value={suplente} onChange={(e) => { setSuplente(e.target.value); setEstado(''); }} maxLength={40} placeholder="Ej: Pérez, J." className={campo} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => correr(() => designarSuplente(f, lider, suplente))}
              disabled={!f || !lider || !suplente.trim() || suplente.trim() === suplenteActual}
              className={`${btn} bg-acero text-seguridad`}
            >
              {suplenteActual ? 'Actualizar suplente' : 'Designar suplente'}
            </button>
            {suplenteActual && (
              <button onClick={() => correr(() => designarSuplente(f, lider, ''))} className={btn}>Quitar suplente</button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-md border-2 border-acero/20 space-y-3">
          <h3 className="font-display text-xl font-bold">Día sin clase</h3>
          <p className="text-sm text-acero/70">Feriado o suspensión: ese día no suma puntos ni cuenta como jornada para el promedio de nadie.</p>
          <label className="block">
            <span className="block text-sm font-medium mb-1">Motivo (opcional)</span>
            <input value={motivo} onChange={(e) => { setMotivo(e.target.value); setEstado(''); }} maxLength={60} placeholder="Ej: Feriado nacional" className={campo} />
          </label>
          {conPuntos.length > 0 && !sinClase && (
            <p role="alert" className="text-sm font-semibold text-alarma">
              Ese día ya hay puntos sumados. Si lo marcás sin clase, salen del resumen semanal pero siguen en la tabla de posiciones.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {sinClase ? (
              <>
                <button onClick={() => correr(() => marcarSinClase(f, true, motivo))} disabled={motivo.trim() === (dia?.motivo ?? '')} className={`${btn} bg-acero text-seguridad`}>Actualizar motivo</button>
                <button onClick={() => correr(() => marcarSinClase(f, false))} className={btn}>Quitar marca</button>
              </>
            ) : (
              <button onClick={() => correr(() => marcarSinClase(f, true, motivo))} disabled={!f} className={`${btn} bg-acero text-seguridad`}>Marcar sin clase</button>
            )}
          </div>
        </div>
      </div>
      {estado === 'ok' && <p role="status" className="mt-3 text-operativa font-semibold">Guardado ✓</p>}

      <h3 className="font-display text-xl font-bold mt-5 mb-2">Días cargados</h3>
      {lista.length === 0 ? (
        <p className="text-sm">Todavía no cargaste ningún día sin clase ni suplente.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {lista.map((d) => (
            <li key={d.id}>
              <b>{etiquetaDia(d.fecha)}</b>
              {d.sinClase && <> · Sin clase{d.motivo ? ` (${d.motivo})` : ''}</>}
              {Object.entries(d.suplentes ?? {}).map(([id, n]) => <span key={id}> · Suplente: {n} (por {nombreLider(id)})</span>)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
