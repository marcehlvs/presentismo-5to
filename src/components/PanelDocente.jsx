import { useEffect, useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { ALUMNOS, IDS_EXTRA, MOMENTOS } from '../data/mockData';
import { CRITERIO_GANADOR, etiquetaDia, etiquetaSemana, lunesDe, puntosDeJornada, resumenTurnos } from '../lib/semanas';
import Leaderboard from './Leaderboard';

const btn = 'px-3 py-1.5 rounded-md border-2 border-acero font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed';
const campo = 'w-full border-2 border-acero rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-seguridad/60';

function FormularioDesafio() {
  const { desafioHoy, criterioDocente, publicarDesafio } = usePlant();
  const [f, setF] = useState({ materia: '', enunciado: '', pista: '', respuestaEsperada: '' });
  const [estado, setEstado] = useState('');

  useEffect(() => {
    setF({
      materia: desafioHoy?.materia ?? '',
      enunciado: desafioHoy?.enunciado ?? '',
      pista: desafioHoy?.pista ?? '',
      respuestaEsperada: criterioDocente,
    });
  }, [desafioHoy, criterioDocente]);

  const cambiar = (e) => {
    setF((p) => ({ ...p, [e.target.name]: e.target.value }));
    setEstado('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    setEstado('guardando');
    setEstado((await publicarDesafio(f)) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Desafío de hoy</h2>
      {!desafioHoy && (
        <p className="mb-3 px-3 py-2 rounded-md bg-seguridad/25 font-semibold">
          Falta publicar el desafío: los alumnos no pueden responder hasta que lo hagas.
        </p>
      )}
      <form onSubmit={enviar} className="space-y-3">
        <label className="block">
          <span className="block text-sm font-medium mb-1">Materia o área</span>
          <input name="materia" value={f.materia} onChange={cambiar} maxLength={40} placeholder="Ej: Matemática, Lengua, Historia" className={campo} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Desafío (lo ven los alumnos)</span>
          <textarea name="enunciado" value={f.enunciado} onChange={cambiar} maxLength={500} rows={4} required className={campo} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Pista (opcional, aparece si rechazás una respuesta)</span>
          <input name="pista" value={f.pista} onChange={cambiar} maxLength={200} className={campo} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium mb-1">Respuesta esperada o criterio (solo la ves vos)</span>
          <textarea name="respuestaEsperada" value={f.respuestaEsperada} onChange={cambiar} maxLength={300} rows={2} className={campo} />
        </label>
        <div className="flex items-center gap-3">
          <button disabled={!f.enunciado.trim() || estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>
            {desafioHoy ? 'Actualizar desafío' : 'Publicar desafío'}
          </button>
          {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Publicado ✓</span>}
        </div>
      </form>
    </section>
  );
}

function FormularioTareasExtra() {
  const { extras, publicarTareasExtra } = usePlant();
  const armar = () => IDS_EXTRA.map((id) => extras.find((x) => x.id === id) ?? { id, titulo: '', momento: 'apertura' });
  const [items, setItems] = useState(armar);
  const [estado, setEstado] = useState('');

  useEffect(() => { setItems(armar()); }, [extras]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (i, campo, valor) => {
    setItems((p) => p.map((x, k) => (k === i ? { ...x, [campo]: valor } : x)));
    setEstado('');
  };
  const guardar = async (e) => {
    e.preventDefault();
    setEstado((await publicarTareasExtra(items)) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Tareas extra de hoy</h2>
      <p className="text-sm text-acero/70 mb-3">Se suman al checklist de los alumnos solo por hoy. Dejá vacío lo que no uses.</p>
      <form onSubmit={guardar} className="space-y-2">
        {items.map((x, i) => (
          <div key={x.id} className="flex flex-col sm:flex-row gap-2">
            <input
              value={x.titulo} onChange={(e) => cambiar(i, 'titulo', e.target.value)} maxLength={60}
              placeholder={`Tarea extra ${i + 1}`} aria-label={`Tarea extra ${i + 1}`} className={campo}
            />
            <select value={x.momento} onChange={(e) => cambiar(i, 'momento', e.target.value)} aria-label="Momento" className={`${campo} sm:w-48`}>
              <option value="apertura">{MOMENTOS.apertura}</option>
              <option value="cierre">{MOMENTOS.cierre}</option>
            </select>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <button className={`${btn} bg-acero text-seguridad`}>Guardar tareas</button>
          {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Guardado ✓</span>}
        </div>
      </form>
    </section>
  );
}

function FormularioPremio() {
  const { semana, premioSemana, publicarPremio } = usePlant();
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => { setTexto(premioSemana?.texto ?? ''); }, [premioSemana]);

  const enviar = async (e) => {
    e.preventDefault();
    setEstado((await publicarPremio(texto)) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Premio de la semana</h2>
      <p className="text-sm text-acero/70 mb-3">{etiquetaSemana(semana)}. Lo ven los alumnos; se entrega al equipo ganador.</p>
      <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-2">
        <input
          value={texto} onChange={(e) => { setTexto(e.target.value); setEstado(''); }} maxLength={120} required
          placeholder="Ej: 10 minutos extra de recreo" aria-label="Premio de la semana" className={campo}
        />
        <button className={`${btn} bg-acero text-seguridad whitespace-nowrap`}>{premioSemana ? 'Actualizar' : 'Publicar'}</button>
      </form>
      {estado === 'ok' && <p role="status" className="mt-2 text-operativa font-semibold">Publicado ✓</p>}
    </section>
  );
}

function Historial() {
  const { historial, premios } = usePlant();

  const semanas = useMemo(() => {
    const porSemana = {};
    historial.forEach((j) => {
      const l = lunesDe(j.fecha);
      porSemana[l] = [...(porSemana[l] ?? []), j];
    });
    return Object.keys(porSemana)
      .sort()
      .reverse()
      .map((lunes) => {
        const jornadas = [...porSemana[lunes]].sort((a, b) => a.fecha.localeCompare(b.fecha));
        return { lunes, jornadas, ...resumenTurnos(jornadas), premio: premios.find((p) => p.id === lunes)?.texto };
      });
  }, [historial, premios]);

  const th = 'text-left font-semibold py-1 pr-3';
  const td = 'py-1 pr-3 tabular-nums';

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-3">Historial semanal</h2>
      {semanas.length === 0 && <p>Todavía no hay jornadas registradas.</p>}
      <div className="space-y-2">
        {semanas.map((s) => (
          <details key={s.lunes} className="border-2 border-acero/20 rounded-md">
            <summary className="cursor-pointer p-3 font-semibold">
              {etiquetaSemana(s.lunes)} · {s.ganador ? `Ganó ${s.ganador.nombre}` : s.empate ? 'Empate' : 'Sin ganador'}
            </summary>
            <div className="p-3 pt-0 space-y-4">
              {s.premio && <p>Premio: <b>{s.premio}</b></p>}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Equipo</th><th className={th}>Puntos</th><th className={th}>Jornadas</th><th className={th}>Promedio</th></tr></thead>
                  <tbody>
                    {s.lista.map((t) => (
                      <tr key={t.id}><td className={td}>{t.nombre}</td><td className={td}>{t.puntos}</td><td className={td}>{t.jornadas}</td><td className={td}>{t.promedio.toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1 text-xs text-acero/60">
                  {CRITERIO_GANADOR === 'promedio' ? 'El ganador se define por promedio de puntos por jornada.' : 'El ganador se define por puntos totales.'}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Día</th><th className={th}>Jefe</th><th className={th}>Puntos</th><th className={th}>Presentes</th><th className={th}>Tarde</th><th className={th}>Tareas ok</th></tr></thead>
                  <tbody>
                    {s.jornadas.map((j) => (
                      <tr key={j.id}>
                        <td className={td}>{etiquetaDia(j.fecha)}</td>
                        <td className={td}>{ALUMNOS.find((a) => a.id === j.jefeId)?.nombre ?? j.jefeId}</td>
                        <td className={td}>{puntosDeJornada(j)}</td>
                        <td className={td}>{j.asistencia?.presentes ?? '–'}</td>
                        <td className={td}>{j.asistencia?.tardes ?? '–'}</td>
                        <td className={td}>{Object.values(j.aprobadas ?? {}).filter(Boolean).length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function ReiniciarPuntos() {
  const { reiniciarPuntos } = usePlant();
  const [abierto, setAbierto] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const [texto, setTexto] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [hecho, setHecho] = useState(false);

  const cerrar = () => { setAbierto(false); setBorrar(false); setTexto(''); };
  const confirmar = async () => {
    setTrabajando(true);
    const ok = await reiniciarPuntos(borrar);
    setTrabajando(false);
    setHecho(ok);
    if (ok) cerrar();
  };

  return (
    <section className="bg-white border-2 border-alarma rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Volver a cero</h2>
      {!abierto ? (
        <>
          <p className="text-sm text-acero/70 mb-3">Deja en 0 los puntos de los cinco equipos.</p>
          <button onClick={() => { setAbierto(true); setHecho(false); }} className={`${btn} text-alarma border-alarma`}>Volver a cero…</button>
          {hecho && <p role="status" className="mt-2 text-operativa font-semibold">Puntos reiniciados ✓</p>}
        </>
      ) : (
        <div role="alertdialog" aria-labelledby="confirmar-titulo" className="space-y-3">
          <p id="confirmar-titulo" className="font-semibold">¿Estás seguro? Los puntos de los cinco equipos vuelven a 0 y no se puede deshacer.</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={borrar} onChange={(e) => setBorrar(e.target.checked)} className="mt-1" />
            <span>Borrar también el historial: checklists, asistencia y puntos de todas las fechas, incluida la de hoy. Sin esta casilla, el historial y el ranking semanal se conservan.</span>
          </label>
          <label className="block text-sm">
            Escribí <b>REINICIAR</b> para confirmar
            <input value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" className={`${campo} mt-1`} />
          </label>
          <div className="flex gap-2">
            <button
              onClick={confirmar} disabled={texto.trim().toUpperCase() !== 'REINICIAR' || trabajando}
              className={`${btn} bg-alarma text-white border-alarma`}
            >
              {trabajando ? 'Reiniciando…' : 'Sí, volver a cero'}
            </button>
            <button onClick={cerrar} disabled={trabajando} className={btn}>Cancelar</button>
          </div>
        </div>
      )}
    </section>
  );
}

export default function PanelDocente() {
  const {
    jornadasHoy, alumnos, tareas, aprobarTarea, aprobarDesafio, rechazarDesafio, logoutDocente, jornada, error,
    desafioHoy, criterioDocente,
  } = usePlant();

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
          <FormularioDesafio />
          <FormularioTareasExtra />
          <FormularioPremio />
          {jornadasHoy.length === 0 && (
            <p className="bg-white border-2 border-acero rounded-lg p-5">Todavía no hay actividad de Jefes de Planta hoy.</p>
          )}
          {jornadasHoy.map((j) => {
            const alumno = alumnos.find((a) => a.id === j.jefeId);
            const ap = j.aprobadas ?? {};
            const dec = j.declaradas ?? {};
            return (
              <section key={j.id} className="bg-white border-2 border-acero rounded-lg p-5">
                <h2 className="font-display text-3xl font-bold mb-3">{alumno?.nombre ?? `Jefe ${j.jefeId}`}</h2>
                {['apertura', 'cierre'].map((m) => (
                  <div key={m} className="mt-4 first:mt-0">
                    <h3 className="font-display text-xl font-bold mb-2">{MOMENTOS[m]}</h3>
                    <ul className="space-y-2">
                  {tareas.filter((t) => t.momento === m).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-md border-2 border-acero/20">
                      <span>
                        <span className="block font-semibold">{t.titulo}</span>
                        <span className="block text-sm text-acero/70">{t.id === 'asistencia' && j.asistencia ? `Presentes: ${j.asistencia.presentes} · Llegadas tarde: ${j.asistencia.tardes}` : dec[t.id] ? 'Marcada por el alumno' : 'Sin marcar'}</span>
                      </span>
                      <button
                        onClick={() => aprobarTarea(j, t.id, !ap[t.id])}
                        disabled={t.id === 'desafio' && !desafioHoy && !ap[t.id]}
                        title={t.id === 'desafio' && !desafioHoy ? 'Publicá primero el desafío de hoy' : undefined}
                        className={`${btn} ${ap[t.id] ? 'bg-operativa text-white border-operativa' : ''}`}
                      >
                        {ap[t.id] ? 'Aprobada ✓' : 'Aprobar'}
                      </button>
                    </li>
                  ))}
                    </ul>
                  </div>
                ))}
                {j.premioChecklist && <p className="mt-2 text-sm text-operativa font-semibold">Checklist matutino completo: puntos ya sumados al equipo.</p>}
                {j.premioCierre && <p className="mt-1 text-sm text-operativa font-semibold">Cierre de planta completo: puntos ya sumados al equipo.</p>}

                <div className="mt-5 p-3 rounded-md border-2 border-acero/20">
                  <p className="font-semibold">Respuesta del alumno al desafío</p>
                  {criterioDocente && <p className="text-sm text-acero/70 mt-1">Tu criterio: {criterioDocente}</p>}
                  <p className="mt-2 whitespace-pre-line">
                    <b>{j.respuesta ?? (j.desafioAprobado ? '(aprobada)' : 'sin enviar')}</b>
                  </p>
                  {j.desafioAprobado ? (
                    <p className="mt-2 text-operativa font-semibold">Aprobado: puntos ya sumados al equipo.</p>
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
          <Historial />
          <ReiniciarPuntos />
        </div>
        <Leaderboard />
      </main>
    </div>
  );
}
