import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { DIAS_CLASE } from '../lib/lideres';
import { diasEdFisicaEn, etiquetaDia, hoyISO, lunesDe, sumarDias, validarDiasEdFisica, versionesEdFisica } from '../lib/semanas';
import { btn, campo } from './estilos';

const proximoLunes = () => sumarDias(lunesDe(hoyISO()), 7);
const nombres = (dias) => (dias.length === 0 ? 'ningún día' : dias.map((d) => DIAS_CLASE[d - 1]).join(', '));

// Qué días de la semana hay Ed. Física, sin tocar el código: el cambio rige desde la fecha elegida y lo anterior no se modifica
export default function DiasEdFisicaEditor() {
  const { versionesEF, guardarDiasEdFisica, quitarVersionEdFisica } = usePlant();
  const [desde, setDesde] = useState(proximoLunes);
  const [dias, setDias] = useState(() => diasEdFisicaEn(versionesEF, proximoLunes()));
  const [estado, setEstado] = useState('');

  const cambiarFecha = (f) => {
    setDesde(f);
    if (f) setDias(diasEdFisicaEn(versionesEF, f)); // el formulario parte de lo que rige ese día
    setEstado('');
  };
  const alternar = (n) => {
    setDias((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n].sort((a, b) => a - b)));
    setEstado('');
  };
  const error = validarDiasEdFisica(dias);
  const guardar = async (e) => {
    e.preventDefault();
    setEstado('guardando');
    setEstado((await guardarDiasEdFisica(desde, dias)) ? 'ok' : '');
  };
  const quitar = async (v) => {
    if (window.confirm(`¿Quitar el cambio de días de Ed. Física que rige desde el ${etiquetaDia(v.desde)}?`)) await quitarVersionEdFisica(v.desde);
  };

  const cambios = [...versionesEdFisica(versionesEF)].reverse();
  const guardadas = new Set(versionesEF.map((v) => v.desde));

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Días de Educación Física</h2>
      <p className="text-sm text-acero/70 mb-3">
        Elegí qué días de la semana hay Ed. Física y desde cuándo. Lo anterior no se modifica: el historial y los puntos de las semanas pasadas quedan como estaban.
        Para un día puntual (lluvia, profe ausente) usá «Suplentes, días sin clase y Ed. Física».
      </p>
      <form onSubmit={guardar} className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="block sm:w-56">
            <span className="block text-sm font-medium mb-1">Vigente desde</span>
            <input type="date" value={desde} onChange={(e) => cambiarFecha(e.target.value)} required className={campo} />
          </label>
          <button type="button" onClick={() => cambiarFecha(proximoLunes())} className={btn}>Próximo lunes</button>
          <button type="button" onClick={() => cambiarFecha(hoyISO())} className={btn}>Hoy</button>
        </div>
        {desde && desde < hoyISO() && (
          <p role="alert" className="text-sm font-semibold text-alarma">
            Esa fecha ya pasó: las semanas desde ese día se van a recalcular con los días nuevos (los puntos de Ed. Física ya sumados no cambian).
          </p>
        )}
        <fieldset>
          <legend className="text-sm font-medium mb-1">Días con Ed. Física</legend>
          <div className="flex flex-wrap gap-2">
            {DIAS_CLASE.map((nombre, i) => (
              <label key={nombre} className={`${btn} cursor-pointer ${dias.includes(i + 1) ? 'bg-acero text-seguridad' : ''}`}>
                <input type="checkbox" checked={dias.includes(i + 1)} onChange={() => alternar(i + 1)} className="sr-only" />
                {nombre}
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="text-sm font-semibold text-alarma">{error}</p>}
        <div className="flex items-center gap-3">
          <button disabled={!!error || !desde || estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>Guardar días</button>
          {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Guardado ✓</span>}
        </div>
      </form>

      <h3 className="font-display text-xl font-bold mt-5 mb-2">Días que rigen</h3>
      <ul className="space-y-1 text-sm">
        {cambios.map((v) => (
          <li key={v.desde} className="flex flex-wrap items-center gap-x-2">
            <b>Desde {etiquetaDia(v.desde)}:</b>
            <span>{nombres(v.dias.map(Number))}</span>
            {guardadas.has(v.desde) && <button onClick={() => quitar(v)} className="underline text-alarma">Quitar</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
