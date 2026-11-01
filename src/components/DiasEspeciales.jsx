import { useEffect, useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { FERIADOS, FERIADOS_DESDE } from '../data/feriados';
import { TURNOS, jefeDelDia } from '../data/mockData';
import { DIAS_CLASE } from '../lib/lideres';
import { deIso, etiquetaDia, puntosDeJornada, sumarDias, textoDiasEdFisica } from '../lib/semanas';
import { btn, campo } from './estilos';

// Suplente del líder, días sin clase y días con Ed. Física, cargados por fecha
export default function DiasEspeciales() {
  const {
    fecha, diasTodos, historial, designarSuplente, marcarSinClase, marcarEdFisica, programarEdFisica, puntosEdFisica, alumnosEn, edFisicaTodos, diasEdFisicaHoy,
  } = usePlant();
  const [f, setF] = useState(fecha);
  const [diaEF, setDiaEF] = useState('3');
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
  const edFisica = !sinClase && edFisicaTodos.has(f);

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
      .filter((d) => !d.virtual && (d.sinClase || d.conClase || Object.keys(d.suplentes ?? {}).length > 0))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 10),
    [diasTodos]
  );
  // Feriados nacionales precargados que vienen (se marcan solos como sin clase)
  const proximosFeriados = useMemo(() => FERIADOS.filter((x) => x.fecha >= fecha && x.fecha >= FERIADOS_DESDE).slice(0, 4), [fecha]);
  // Fechas con Ed. Física que se cargaron a mano (los días de la semana con Ed. Física ya vienen solos) y fechas quitadas
  const fechasEF = useMemo(() => diasTodos.filter((d) => d.edFisica).map((d) => d.fecha).sort(), [diasTodos]);
  const proximasEF = useMemo(() => fechasEF.filter((x) => x >= fecha).slice(0, 8), [fechasEF, fecha]);
  const quitadasEF = useMemo(() => diasTodos.filter((d) => d.sinEdFisica && d.fecha >= fecha).map((d) => d.fecha).sort().slice(0, 8), [diasTodos, fecha]);

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

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
          <p className="text-sm text-acero/70">Feriado o suspensión: ese día no suma puntos ni cuenta como jornada para el promedio de nadie. Los feriados nacionales ya vienen marcados solos.</p>
          {dia?.feriado && (
            <p className="text-sm font-semibold">
              Feriado nacional: {dia.feriado}.{dia.conClase ? ' Habilitaste clase este día.' : ''}
            </p>
          )}
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
                <button onClick={() => correr(() => marcarSinClase(f, false))} className={btn}>{dia?.feriado ? 'Hay clase este día' : 'Quitar marca'}</button>
              </>
            ) : dia?.conClase ? (
              <button onClick={() => correr(() => marcarSinClase(f, true, dia.feriado))} className={`${btn} bg-acero text-seguridad`}>Volver a marcar sin clase</button>
            ) : (
              <button onClick={() => correr(() => marcarSinClase(f, true, motivo))} disabled={!f} className={`${btn} bg-acero text-seguridad`}>Marcar sin clase</button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-md border-2 border-acero/20 space-y-3 md:col-span-2">
          <h3 className="font-display text-xl font-bold">Educación Física</h3>
          <p className="text-sm text-acero/70">
            Se hace fuera del aula y tiene su propio checklist, que le toca al líder del día. Aparece solo {textoDiasEdFisica(diasEdFisicaHoy)} (se cambia en «Días de Educación Física»); acá podés quitarla un día puntual (lluvia, feriado, profe ausente) o sumar otro día. Suma {puntosEdFisica} puntos al equipo cuando se aprueba todo.
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
            {edFisica && <span className="text-sm font-semibold text-operativa">Hay Ed. Física ese día ✓</span>}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-end">
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
              ? `No hay días extra marcados a mano (además de ${textoDiasEdFisica(diasEdFisicaHoy)}).`
              : <>Días extra con Ed. Física ({fechasEF.filter((x) => x >= fecha).length} en total): <b>{proximasEF.map(etiquetaDia).join(' · ')}</b></>}
          </p>
          {quitadasEF.length > 0 && (
            <p className="text-sm">Días con Ed. Física automática en los que se quitó: <b>{quitadasEF.map(etiquetaDia).join(' · ')}</b></p>
          )}
        </div>
      </div>
      {estado === 'ok' && <p role="status" className="mt-3 text-operativa font-semibold">Guardado ✓</p>}

      <h3 className="font-display text-xl font-bold mt-5 mb-2">Días cargados</h3>
      {proximosFeriados.length > 0 && (
        <p className="text-sm mb-2">
          Próximos feriados (ya marcados sin clase): <b>{proximosFeriados.map((x) => etiquetaDia(x.fecha)).join(' · ')}</b>. Si ese día sí hay clase, elegí la fecha y tocá «Hay clase este día».
        </p>
      )}
      {lista.length === 0 ? (
        <p className="text-sm">Todavía no cargaste ningún día sin clase ni suplente.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {lista.map((d) => (
            <li key={d.id}>
              <b>{etiquetaDia(d.fecha)}</b>
              {d.sinClase && <> · Sin clase{d.motivo ? ` (${d.motivo})` : ''}</>}
              {d.conClase && <> · Feriado con clase{d.feriado ? ` (${d.feriado})` : ''}</>}
              {Object.entries(d.suplentes ?? {}).map(([id, n]) => <span key={id}> · Suplente: {n} (por {nombreLider(id, d.fecha)})</span>)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}