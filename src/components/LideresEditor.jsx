import { useEffect, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { AVATARES } from '../data/avatares';
import { TURNOS } from '../data/mockData';
import { DIAS_CLASE, validarLideres } from '../lib/lideres';
import { etiquetaDia, hoyISO, lunesDe, sumarDias } from '../lib/semanas';
import { btn, campo } from './estilos';

const proximoLunes = () => sumarDias(lunesDe(hoyISO()), 7);
const paraFormulario = (alumnos) => alumnos.map(({ id, nombre, dia, turno, avatar }) => ({ id, nombre, dia, turno, avatar }));
const nombreEquipo = (turno) => TURNOS.find((t) => t.id === turno)?.nombre ?? turno;

// Cambio de líderes sin tocar el código: se elige desde qué fecha rige y el historial conserva los nombres de cada fecha
export default function LideresEditor() {
  const { alumnosEn, versionesLideres, guardarLideres, quitarVersionLideres } = usePlant();
  const [desde, setDesde] = useState(proximoLunes);
  const [items, setItems] = useState(() => paraFormulario(alumnosEn(desde)));
  const [estado, setEstado] = useState('');

  // Al cambiar la fecha (o cuando llegan datos nuevos) el formulario muestra los líderes que rigen ese día
  useEffect(() => { setItems(paraFormulario(alumnosEn(desde))); }, [desde, alumnosEn]);

  const cambiar = (i, clave, valor) => {
    setItems((p) => p.map((x, k) => (k === i ? { ...x, [clave]: valor } : x)));
    setEstado('');
  };
  const error = validarLideres(items);
  const guardar = async (e) => {
    e.preventDefault();
    setEstado('guardando');
    setEstado((await guardarLideres(desde, items)) ? 'ok' : '');
  };
  const quitar = async (v) => {
    if (window.confirm(`¿Quitar el cambio de líderes que rige desde el ${etiquetaDia(v.desde)}?`)) await quitarVersionLideres(v.desde);
  };

  const cambios = [...versionesLideres].sort((a, b) => b.desde.localeCompare(a.desde));

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Líderes de la semana</h2>
      <p className="text-sm text-acero/70 mb-3">
        Cada equipo conserva su puesto y sus puntos: lo que cambia es quién lo lidera, qué día le toca y su avatar. El cambio rige desde la fecha que elijas
        y lo anterior no se modifica (el historial muestra el líder de cada día).
      </p>
      <form onSubmit={guardar} className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block sm:w-56">
            <span className="block text-sm font-medium mb-1">Vigente desde</span>
            <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setEstado(''); }} required className={campo} />
          </label>
          <button type="button" onClick={() => setDesde(proximoLunes())} className={btn}>Próximo lunes</button>
          <button type="button" onClick={() => setDesde(hoyISO())} className={btn}>Hoy</button>
        </div>
        {desde && desde < hoyISO() && (
          <p role="alert" className="text-sm font-semibold text-alarma">Esa fecha ya pasó: el historial desde ese día va a mostrar los nombres nuevos.</p>
        )}
        <div className="space-y-2">
          {items.map((x, i) => (
            <div key={x.id} className="grid gap-2 sm:grid-cols-[9rem_8rem_1fr_11rem] items-center">
              <select value={x.dia} onChange={(e) => cambiar(i, 'dia', e.target.value)} aria-label={`Día del equipo ${nombreEquipo(x.turno)}`} className={campo}>
                {DIAS_CLASE.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={x.avatar ?? ''} onChange={(e) => cambiar(i, 'avatar', e.target.value)} aria-label={`Avatar del equipo ${nombreEquipo(x.turno)}`} className={campo}>
                {AVATARES.map((a) => <option key={a.emoji} value={a.emoji}>{a.emoji} {a.nombre}</option>)}
              </select>
              <input
                value={x.nombre} onChange={(e) => cambiar(i, 'nombre', e.target.value)} maxLength={40} placeholder="Apellido, N."
                aria-label={`Líder del equipo ${nombreEquipo(x.turno)}`} className={campo}
              />
              <span className="text-sm text-acero/70">{nombreEquipo(x.turno)}</span>
            </div>
          ))}
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-alarma">{error}</p>}
        <div className="flex items-center gap-3">
          <button disabled={!!error || !desde || estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>Guardar líderes</button>
          {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Guardado ✓</span>}
        </div>
      </form>

      <h3 className="font-display text-xl font-bold mt-5 mb-2">Cambios cargados</h3>
      {cambios.length === 0 ? (
        <p className="text-sm">Todavía no cargaste ningún cambio: rigen los líderes de la versión instalada.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {cambios.map((v) => (
            <li key={v.desde} className="flex flex-wrap items-center gap-x-2">
              <b>Desde {etiquetaDia(v.desde)}:</b>
              <span>{DIAS_CLASE.map((d) => v.items.find((x) => x.dia === d)).filter(Boolean).map((x) => `${x.avatar ? `${x.avatar} ` : ''}${x.dia.slice(0, 3)} ${x.nombre}`).join(' · ')}</span>
              <button onClick={() => quitar(v)} className="underline text-alarma">Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
