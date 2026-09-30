import { useEffect, useState } from 'react';
import {
  Timer, Wind, MonitorCheck, Presentation, Users, Sparkles, Power, Lightbulb, ClipboardList, Cog, CircleCheck,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';

const ICONOS = { Timer, Wind, MonitorCheck, Presentation, Users, Sparkles, Power, Lightbulb, ClipboardList };

const estilo = (aprobada, hecha) =>
  aprobada ? 'border-operativa bg-operativa/10' : hecha ? 'border-seguridad bg-seguridad/10' : 'border-acero/20';

function Casilla({ aprobada, hecha }) {
  return (
    <span
      className={`size-7 shrink-0 rounded-md border-2 flex items-center justify-center ${
        aprobada ? 'bg-operativa border-operativa text-white' : hecha ? 'bg-seguridad border-seguridad text-acero' : 'border-acero bg-white'
      }`}
      aria-hidden="true"
    >
      {(hecha || aprobada) && <CircleCheck className="size-5" />}
    </span>
  );
}

// Solo cantidades: no se registran nombres
function FilaAsistencia({ t }) {
  const { asistencia, hechas, aprobadas, guardarAsistencia } = usePlant();
  const [presentes, setPresentes] = useState('');
  const [tardes, setTardes] = useState('');
  const aprobada = !!aprobadas[t.id];
  const hecha = !!hechas[t.id];

  useEffect(() => {
    if (asistencia) {
      setPresentes(String(asistencia.presentes));
      setTardes(String(asistencia.tardes));
    }
  }, [asistencia]);

  const p = Number(presentes);
  const l = Number(tardes);
  const enteros = presentes !== '' && tardes !== '' && Number.isInteger(p) && Number.isInteger(l);
  const rango = enteros && p >= 0 && p <= 60 && l >= 0;
  const valido = rango && l <= p;
  const campo = 'w-24 border-2 border-acero rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-seguridad/60 disabled:bg-hormigon';

  return (
    <li className={`p-3 rounded-md border-2 ${estilo(aprobada, hecha)}`}>
      <div className="flex items-center gap-3">
        <Casilla aprobada={aprobada} hecha={hecha} />
        <Users className="size-6 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className={`block font-semibold ${aprobada ? 'line-through decoration-2' : ''}`}>{t.titulo}</span>
          <span className="block text-sm text-acero/70">{t.detalle}</span>
        </span>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (valido) guardarAsistencia(p, l); }}
        className="mt-3 flex flex-wrap items-end gap-3 sm:pl-10"
      >
        <label className="text-sm font-medium">
          Presentes
          <input type="number" inputMode="numeric" min="0" max="60" value={presentes} disabled={aprobada}
            onChange={(e) => setPresentes(e.target.value)} className={`${campo} mt-1 block`} />
        </label>
        <label className="text-sm font-medium">
          Llegadas tarde
          <input type="number" inputMode="numeric" min="0" max="60" value={tardes} disabled={aprobada}
            onChange={(e) => setTardes(e.target.value)} className={`${campo} mt-1 block`} />
        </label>
        <button
          disabled={!valido || aprobada}
          className="px-4 py-2 rounded-md bg-acero text-seguridad font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {hecha ? 'Actualizar' : 'Guardar'}
        </button>
      </form>
      {enteros && l > p && <p role="alert" className="mt-2 text-sm text-alarma font-semibold sm:pl-10">Las llegadas tarde no pueden superar a los presentes.</p>}
      {(hecha || aprobada) && (
        <p className="mt-2 text-sm font-medium sm:pl-10">{aprobada ? 'Aprobada por el docente' : 'Esperando aprobación del docente'}</p>
      )}
    </li>
  );
}

export default function Checklist({ momento, titulo }) {
  const { tareas, hechas, aprobadas, toggleTarea, plantaOperativa, plantaCerrada, puntosChecklist, puntosCierre } = usePlant();
  const lista = tareas.filter((t) => t.momento === momento);
  const completadas = lista.filter((t) => aprobadas[t.id]).length;
  const completo = momento === 'cierre' ? plantaCerrada : plantaOperativa;
  const idTitulo = `titulo-${momento}`;

  return (
    <section aria-labelledby={idTitulo} className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 id={idTitulo} className="font-display text-3xl font-bold">{titulo}</h2>
        <span className="font-medium tabular-nums">{completadas} de {lista.length} aprobadas</span>
      </div>

      <div className="h-2 bg-hormigon rounded-full overflow-hidden mb-5" role="progressbar" aria-valuemin={0} aria-valuemax={lista.length} aria-valuenow={completadas}>
        <div className="h-full bg-operativa transition-all duration-300" style={{ width: `${lista.length ? (completadas / lista.length) * 100 : 0}%` }} />
      </div>

      <ul className="space-y-2">
        {lista.map((t) => {
          if (t.id === 'asistencia') return <FilaAsistencia key={t.id} t={t} />;
          const Icono = ICONOS[t.icono] ?? ClipboardList;
          const hecha = !!hechas[t.id];
          const aprobada = !!aprobadas[t.id];
          return (
            <li key={t.id}>
              <label
                className={`flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-seguridad/60 ${estilo(aprobada, hecha)} ${
                  !aprobada && !hecha ? 'hover:border-acero' : ''
                }`}
              >
                <input type="checkbox" checked={hecha} onChange={() => toggleTarea(t.id)} className="sr-only" />
                <Casilla aprobada={aprobada} hecha={hecha} />
                <Icono className="size-6 shrink-0" aria-hidden="true" />
                <span className="min-w-0">
                  <span className={`block font-semibold ${aprobada ? 'line-through decoration-2' : ''}`}>{t.titulo}</span>
                  <span className="block text-sm text-acero/70">{t.detalle}</span>
                  {(hecha || aprobada) && (
                    <span className="block text-sm font-medium">
                      {aprobada ? 'Aprobada por el docente' : 'Esperando aprobación del docente'}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {completo && (
        <div role="status" className="anim-exito mt-5 flex items-center gap-4 bg-operativa text-white rounded-md p-4">
          <Cog className="anim-giro size-10 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-display text-2xl font-bold leading-tight">{momento === 'cierre' ? '¡Planta cerrada!' : '¡Planta operativa!'}</p>
            <p className="text-sm">
              {momento === 'cierre' ? 'Cierre aprobado' : 'Checklist aprobado'}. Tu equipo suma {momento === 'cierre' ? puntosCierre : puntosChecklist} puntos.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
