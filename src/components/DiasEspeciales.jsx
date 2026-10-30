import { useEffect, useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { TURNOS, jefeDelDia } from '../data/mockData';
import { DIAS_CLASE } from '../lib/lideres';
import { deIso, etiquetaDia, puntosDeJornada, sumarDias } from '../lib/semanas';
import { btn, campo } from './estilos';

// Suplente del líder, días sin clase y días con Ed. Física, cargados por fecha
export default function DiasEspeciales() {
  const {
    fecha, diasTodos, historial, designarSuplente, marcarSinClase, marcarEdFisica, programarEdFisica, puntosEdFisica, alumnosEn,
  } = usePlant();
  const [f, setF] = useState(fecha);
  const [diaEF, setDiaEF] = useState('2');
  const [hastaEF, setHastaEF] = useState(() => sumarDias(fecha, 56));
  const [msjEF, setMsjEF] = useState('');
  const nombreLider = (id, fechaDia) => alumnosEn(fechaDia).find((a) => a.id === Number(id))?.nombre ?? `Jefe ${id}`;
  const [lider, setLider] = useState('');
  const [suplente, setSuplente] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState('');

  const dia = diasTodos.find((d) => d.fecha === f);
  const suplenteActual = dia?.suplentes?.[lider] ?? '';
  const sinClase = !!dia?.sinClase;
  const edFisica = !!dia?.edFisica;

  // Al cambiar la fecha, el líder por defecto es el de ese día de la semana
  useEffect(() => {
    if (!f) return;
    const l = jefeDelDia(deIso(f), alumnosEn(f));
    setLider(l ? String(l.id) : '');
    setEstado('');
    setMsjEF('');
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setSuplente(suplenteActual); }, [suplenteActual, f, lider]);
  useEffect(() => { setMotivo(dia?.motivo ?? ''); }, [dia?.motivo, f]);

  // Si ya hay puntos ese día, marcarlo sin clase los saca del resumen semanal pero no de la tabla de posiciones
  const conPuntos = useMemo(
    () => historial.filter((j) => j.fecha === f && puntosDeJornada(j) > 0),
    [historial, f]
  );

  // Los días con Ed. Física se listan aparte: si no, llenarían la lista y taparían los sin clase y los suplentes
  const lista = useMemo(
    () => diasTodos
      .filter((d) => d.sinClase || Object.keys(d.suplentes ?? {}).length > 0)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10),
    [diasTodos]
  );
  const fechasEF = useMemo(() => diasTodos.filter((d) => d.edFisica).map((d) => d.fecha).sort(), [diasTodos]);
  const proximasEF = useMemo(() => fechasEF.filter((x) => x >= fecha).slice(0, 8), [fechasEF, fecha]);

  const programar = async () => {
    setMsjEF('');
    const n = await programarEdFisica(diaEF, f, hastaEF);
    setMsjEF(n > 0 ? `Listo: Ed. Física marcada en ${n} ${n === 1 ? 'fecha' : 'fechas'}.` : 'No se marcó ninguna fecha: revisá el rango.');
  };

  const correr = async (accion) => {
    setEstado('');
    setEstado((await accion()) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Suplentes, días sin clase y Ed. Física</h2>
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
              {alumnosEn(f).map((a) => (
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

        <div className="p-3 rounded-md border-2 border-acero/20 space-y-3 md:col-span-2">
          <h3 className="font-display text-xl font-bold">Educación Física</h3>
          <p className="text-sm text-acero/70">
            Se hace fuera del aula y tiene su propio checklist, que le toca al líder del día. Solo aparece los días que marques acá y suma {puntosEdFisica} puntos al equipo cuando se aprueba todo.
            Los puntos de ese día no le dan ventaja a ningún equipo: el promedio de la semana se calcula sobre los puntos posibles.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {edFisica ? (
              <button onClick={() => correr(() => marcarEdFisica(f, false))} className={btn}>Quitar Ed. Física del {etiquetaDia(f)}</button>
            ) : (
              <button
                onClick={() => correr(() => marcarEdFisica(f, true))} disabled={!f || sinClase}
                title={sinClase ? 'Ese día no hay clase' : undefined}
                className={`${btn} bg-acero text-seguridad`}
              >
                Hay Ed. Física el {f ? etiquetaDia(f) : 'día elegido'}
              </button>
            )}
            {edFisica && <span className="text-sm font-semibold text-operativa">Ed. Física marcada para ese día ✓</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
            <label className="block">
              <span className="block text-sm font-medium mb-1">Repetir todos los…</span>
              <select value={diaEF} onChange={(e) => { setDiaEF(e.target.value); setMsjEF(''); }} className={campo}>
                {DIAS_CLASE.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">…desde la fecha de arriba hasta</span>
              <input type="date" value={hastaEF} min={f} onChange={(e) => { setHastaEF(e.target.value); setMsjEF(''); }} className={campo} />
            </label>
            <button onClick={programar} disabled={!f || !hastaEF || hastaEF < f} className={`${btn} bg-acero text-seguridad`}>Marcar esos días</button>
          </div>
          {msjEF && <p role="status" className="text-sm font-semibold text-operativa">{msjEF}</p>}
          <p className="text-sm">
            {proximasEF.length === 0
              ? 'Todavía no hay próximas fechas con Ed. Física.'
              : <>Próximas fechas con Ed. Física ({fechasEF.filter((x) => x >= fecha).length} en total): <b>{proximasEF.map(etiquetaDia).join(' · ')}</b></>}
          </p>
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
              {Object.entries(d.suplentes ?? {}).map(([id, n]) => <span key={id}> · Suplente: {n} (por {nombreLider(id, d.fecha)})</span>)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
