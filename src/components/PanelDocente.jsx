import { useEffect, useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { IDS_EXTRA, MOMENTOS, TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, TAREA_EXTRA_MAX, etiquetaDia, etiquetaSemana, lunesDe, puntosDeJornada, resumenPorSemana } from '../lib/semanas';
import { exportarHistorial } from '../lib/exportar';
import Leaderboard from './Leaderboard';
import AvisoSinClase from './AvisoSinClase';
import FilaTareaDocente from './FilaTareaDocente';
import RevisionDesafio from './RevisionDesafio';
import DiasEspeciales from './DiasEspeciales';
import Bonos from './Bonos';
import EvolucionSemanal from './EvolucionSemanal';
import Creditos from './Creditos';
import DiasEdFisicaEditor from './DiasEdFisicaEditor';
import LideresEditor from './LideresEditor';
import PinesEditor from './PinesEditor';
import VerificarPuntos from './VerificarPuntos';
import ResumenSemanal from './ResumenSemanal';
import Pendientes from './Pendientes';
import Solapas from './Solapas';
import { solapaValida } from '../lib/solapas';
import { btn, campo } from './estilos';

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
            <textarea
              value={x.titulo} onChange={(e) => cambiar(i, 'titulo', e.target.value)} maxLength={TAREA_EXTRA_MAX} rows={2}
              placeholder={`Tarea extra ${i + 1}`} aria-label={`Tarea extra ${i + 1}`} className={`${campo} resize-y`}
            />
            <select value={x.momento} onChange={(e) => cambiar(i, 'momento', e.target.value)} aria-label="Momento" className={`${campo} sm:w-48`}>
              <option value="apertura">{MOMENTOS.apertura}</option>
              <option value="edfisica">{MOMENTOS.edfisica} (si hay ese día)</option>
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
  const { historial, premios, bonosTodos, diasTodos, sinClaseTodos, edFisicaTodos, alumnosEn, versionesEF } = usePlant();
  const [exportando, setExportando] = useState(false);
  const [falloExport, setFalloExport] = useState(false);

  const semanas = useMemo(
    () =>
      resumenPorSemana(historial, bonosTodos, sinClaseTodos, edFisicaTodos)
        .reverse()
        .map((s) => ({
          ...s,
          jornadas: historial.filter((j) => lunesDe(j.fecha) === s.lunes).sort((a, b) => a.fecha.localeCompare(b.fecha)),
          bonos: bonosTodos.filter((b) => lunesDe(b.fecha) === s.lunes).sort((a, b) => a.fecha.localeCompare(b.fecha)),
          dias: diasTodos.filter((d) => lunesDe(d.fecha) === s.lunes).sort((a, b) => a.fecha.localeCompare(b.fecha)),
          premio: premios.find((p) => p.id === s.lunes)?.texto,
        })),
    [historial, premios, bonosTodos, diasTodos, sinClaseTodos, edFisicaTodos]
  );

  const exportar = async () => {
    setExportando(true);
    setFalloExport(false);
    try {
      await exportarHistorial({ jornadas: historial, bonos: bonosTodos, dias: diasTodos, premios, alumnosEn, versionesEF });
    } catch (e) {
      console.error('[Exportar]', e);
      setFalloExport(true);
    }
    setExportando(false);
  };

  const th = 'text-left font-semibold py-1 pr-3';
  const td = 'py-1 pr-3 tabular-nums';

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-display text-3xl font-bold">Historial semanal</h2>
        <button onClick={exportar} disabled={exportando || semanas.length === 0} className={`${btn} bg-acero text-seguridad`}>
          {exportando ? 'Preparando planilla…' : 'Exportar a planilla (.xlsx)'}
        </button>
      </div>
      {falloExport && <p role="alert" className="mb-3 text-alarma font-semibold">No se pudo generar la planilla. Probá de nuevo.</p>}
      {semanas.length === 0 && <p>Todavía no hay jornadas registradas.</p>}
      <div className="space-y-2">
        {semanas.map((s) => (
          <details key={s.lunes} className="border-2 border-acero/20 rounded-md">
            <summary className="cursor-pointer p-3 font-semibold">
              {etiquetaSemana(s.lunes)} · {s.ganador ? `Ganó ${s.ganador.nombre}` : s.empate ? 'Empate' : 'Sin ganador'}
            </summary>
            <div className="p-3 pt-0 space-y-4">
              {s.premio && <p>Premio: <b>{s.premio}</b></p>}
              {s.dias.some((d) => d.sinClase) && (
                <p className="text-sm">
                  Sin clase: {s.dias.filter((d) => d.sinClase).map((d) => `${etiquetaDia(d.fecha)}${d.motivo ? ` (${d.motivo})` : ''}`).join(', ')}. No cuentan para el promedio.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Equipo</th><th className={th}>Puntos</th><th className={th}>Bonos</th><th className={th}>Jornadas</th><th className={th}>Promedio</th></tr></thead>
                  <tbody>
                    {s.lista.map((t) => (
                      <tr key={t.id}><td className={td}>{t.nombre}</td><td className={td}>{t.puntos}</td><td className={td}>{t.bonos}</td><td className={td}>{t.jornadas}</td><td className={td}>{t.promedio.toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-1 text-xs text-acero/60">
                  {CRITERIO_GANADOR === 'promedio' ? 'El ganador se define por promedio de puntos por jornada (los puntos incluyen los bonos).' : 'El ganador se define por puntos totales (los puntos incluyen los bonos).'}
                </p>
              </div>
              {s.bonos.length > 0 && (
                <ul className="text-sm space-y-0.5">
                  {s.bonos.map((b) => (
                    <li key={b.id}><b className="tabular-nums">+{b.puntos}</b> {TURNOS.find((t) => t.id === b.turnoId)?.nombre} · {b.motivo} · {etiquetaDia(b.fecha)}</li>
                  ))}
                </ul>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Día</th><th className={th}>Jefe</th><th className={th}>Puntos</th><th className={th}>Presentes</th><th className={th}>Tarde</th><th className={th}>Tareas ok</th></tr></thead>
                  <tbody>
                    {s.jornadas.map((j) => {
                      const suplente = s.dias.find((d) => d.fecha === j.fecha)?.suplentes?.[String(j.jefeId)];
                      const sinClase = sinClaseTodos.has(j.fecha);
                      return (
                        <tr key={j.id}>
                          <td className={td}>{etiquetaDia(j.fecha)}</td>
                          <td className={td}>
                            {alumnosEn(j.fecha).find((a) => a.id === j.jefeId)?.nombre ?? j.jefeId}
                            {suplente && <span className="text-acero/70"> · suplente: {suplente}</span>}
                          </td>
                          <td className={td}>{sinClase ? 'sin clase' : puntosDeJornada(j)}</td>
                          <td className={td}>{j.asistencia?.presentes ?? '–'}</td>
                          <td className={td}>{j.asistencia?.tardes ?? '–'}</td>
                          <td className={td}>{Object.values(j.aprobadas ?? {}).filter(Boolean).length}</td>
                        </tr>
                      );
                    })}
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
  const { reiniciarPuntos, esSuperadmin, historial, bonosTodos, diasTodos, premios, alumnosEn, versionesEF } = usePlant();
  const [abierto, setAbierto] = useState(false);
  const [sinCopia, setSinCopia] = useState(false); // reiniciar aunque falle la descarga de la copia
  const [falloCopia, setFalloCopia] = useState(false);
  const [texto, setTexto] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [hecho, setHecho] = useState(false);

  if (!esSuperadmin) return null; // solo la cuenta superadmin (docentes/{uid}.rol = 'superadmin')

  const cerrar = () => { setAbierto(false); setTexto(''); setSinCopia(false); setFalloCopia(false); };
  const confirmar = async () => {
    setTrabajando(true);
    setFalloCopia(false);
    // Antes de borrar, se descarga una copia en Excel de todo el historial; si falla, no se borra nada (salvo que se tilde la casilla)
    try {
      await exportarHistorial({ jornadas: historial, bonos: bonosTodos, dias: diasTodos, premios, alumnosEn, versionesEF });
    } catch (e) {
      console.error('[Exportar]', e);
      if (!sinCopia) { setFalloCopia(true); setTrabajando(false); return; }
    }
    const ok = await reiniciarPuntos();
    setTrabajando(false);
    setHecho(ok);
    if (ok) cerrar();
  };

  return (
    <section className="bg-white border-2 border-alarma rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Volver a cero</h2>
      {!abierto ? (
        <>
          <p className="text-sm text-acero/70 mb-3">Reinicia todo: puntos de los cinco equipos, checklists, asistencia, bonos, y el desafío y las tareas extra de hoy. Antes descarga una copia en Excel.</p>
          <button onClick={() => { setAbierto(true); setHecho(false); }} className={`${btn} text-alarma border-alarma`}>Volver a cero…</button>
          {hecho && <p role="status" className="mt-2 text-operativa font-semibold">Todo reiniciado ✓</p>}
        </>
      ) : (
        <div role="alertdialog" aria-labelledby="confirmar-titulo" className="space-y-3">
          <p id="confirmar-titulo" className="font-semibold">
            ¿Estás seguro? Se borran los puntos de los cinco equipos, todo el historial (checklists, asistencia, respuestas, bonos de todas las fechas), el desafío de hoy y las tareas extra de hoy. No se puede deshacer.
          </p>
          <p className="text-sm">Antes de borrar se descarga una copia en Excel del historial. No se borran: los líderes, los días sin clase, suplentes y Ed. Física, ni los premios de la semana.</p>
          {falloCopia && (
            <div role="alert" className="text-alarma text-sm font-semibold space-y-2">
              <p>No se pudo descargar la copia, así que no se borró nada. Probá de nuevo, o tildá la casilla para reiniciar igual.</p>
              <label className="flex items-start gap-2 font-normal text-acero">
                <input type="checkbox" checked={sinCopia} onChange={(e) => setSinCopia(e.target.checked)} className="mt-1" />
                <span>Reiniciar aunque no haya copia de seguridad</span>
              </label>
            </div>
          )}
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

const SOLAPA_KEY = 'panel-docente-solapa';
const IDS_SOLAPAS = ['hoy', 'semana', 'calendario', 'lideres', 'puntos'];

export default function PanelDocente() {
  const { jornadasHoy, alumnos, tareas, logoutDocente, jornada, error, suplentesHoy, hoyEdFisica } = usePlant();
  const [activa, setActiva] = useState(() => {
    try { return solapaValida(IDS_SOLAPAS, sessionStorage.getItem(SOLAPA_KEY)); } catch { return IDS_SOLAPAS[0]; }
  });
  const cambiar = (id) => {
    setActiva(id);
    try { sessionStorage.setItem(SOLAPA_KEY, id); } catch { /* sin almacenamiento */ }
    window.scrollTo?.({ top: 0 });
  };

  const hoy = (
    <>
      <AvisoSinClase />
      <Pendientes />
      {hoyEdFisica && (
        <p role="status" className="rounded-lg border-2 border-operativa bg-operativa/10 p-4 font-semibold">
          Hoy hay Educación Física: los alumnos ven su checklist y lo aprobás acá, en el bloque “Educación Física” de cada líder.
        </p>
      )}
      <FormularioDesafio />
      <FormularioTareasExtra />
      {jornadasHoy.length === 0 && (
        <p className="bg-white border-2 border-acero rounded-lg p-5">Todavía no hay actividad de Jefes de Planta hoy.</p>
      )}
      {jornadasHoy.map((j) => {
        const alumno = alumnos.find((a) => a.id === j.jefeId);
        const suplente = suplentesHoy[String(j.jefeId)];
        return (
          <section key={j.id} className="bg-white border-2 border-acero rounded-lg p-5">
            <h2 className="font-display text-3xl font-bold mb-3">
              {alumno?.nombre ?? `Jefe ${j.jefeId}`}
              {suplente && <span className="block font-sans text-base font-medium text-acero/70">Hoy lo reemplaza {suplente}. Los puntos van al equipo del líder.</span>}
            </h2>
            {['apertura', ...(hoyEdFisica ? ['edfisica'] : []), 'cierre'].map((m) => (
              <div key={m} className="mt-4 first:mt-0">
                <h3 className="font-display text-xl font-bold mb-2">{MOMENTOS[m]}</h3>
                <ul className="space-y-2">
                  {tareas.filter((t) => t.momento === m).map((t) => <FilaTareaDocente key={t.id} j={j} t={t} />)}
                </ul>
              </div>
            ))}
            {j.premioChecklist && <p className="mt-2 text-sm text-operativa font-semibold">Checklist matutino completo: puntos ya sumados al equipo.</p>}
            {j.premioCierre && <p className="mt-1 text-sm text-operativa font-semibold">Cierre de planta completo: puntos ya sumados al equipo.</p>}
            {j.premioEdFisica && <p className="mt-1 text-sm text-operativa font-semibold">Educación Física completa: puntos ya sumados al equipo.</p>}

            <RevisionDesafio j={j} />
          </section>
        );
      })}
    </>
  );

  const solapas = [
    { id: 'hoy', titulo: 'Hoy', contenido: hoy },
    { id: 'semana', titulo: 'Semana', contenido: <><FormularioPremio /><ResumenSemanal /><EvolucionSemanal /></> },
    { id: 'calendario', titulo: 'Calendario', contenido: <><DiasEspeciales /><DiasEdFisicaEditor /></> },
    { id: 'lideres', titulo: 'Líderes', contenido: <><LideresEditor /><PinesEditor /></> },
    { id: 'puntos', titulo: 'Puntos', contenido: <><Bonos /><VerificarPuntos /><Historial /><ReiniciarPuntos /></> },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-acero text-white">
        <div className="franja-peligro h-3" />
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-bold leading-none">Panel docente</p>
            <p className="text-white/75 mt-1">{jornada.diaNombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/pantalla" className="px-3 py-2 rounded-md border border-white/40 hover:bg-white/10">Modo pantalla</a>
            <button onClick={logoutDocente} className="px-3 py-2 rounded-md border border-white/40 hover:bg-white/10">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-6 grid gap-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="space-y-4 min-w-0">
          {error && <p role="alert" className="text-alarma font-semibold pt-4">{error}</p>}
          <Solapas solapas={solapas} activa={activa} onCambiar={cambiar} />
        </div>
        {/* La tabla de posiciones acompaña a "Hoy" y "Semana"; en el celular no se repite al pie de las demás solapas */}
        <div className={`min-w-0 lg:pt-2 ${activa === 'hoy' || activa === 'semana' ? '' : 'hidden lg:block'}`}>
          <Leaderboard />
        </div>
      </main>
      <Creditos className="pb-6" />
    </div>
  );
}
