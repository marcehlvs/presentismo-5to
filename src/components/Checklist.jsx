import { useEffect, useState } from 'react';
import {
  Timer, Wind, MonitorCheck, Presentation, Users, Sparkles, Power, Lightbulb, ClipboardList, Cog, CircleCheck,
  DoorOpen, Shirt, Droplets, PackageOpen, PackageCheck, Footprints, Dumbbell,
} from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import Devolucion from './Devolucion';

const ICONOS = {
  Timer, Wind, MonitorCheck, Presentation, Users, Sparkles, Power, Lightbulb, ClipboardList,
  DoorOpen, Shirt, Droplets, PackageOpen, PackageCheck, Footprints,
};

const MENSAJES_EXITO = {
  apertura: { titulo: '¡Planta operativa!', detalle: 'Checklist aprobado' },
  edfisica: { titulo: '¡Ed. Física completa!', detalle: 'Checklist de Ed. Física aprobado' },
  cierre: { titulo: '¡Planta cerrada!', detalle: 'Cierre aprobado' },
};

const estilo = (aprobada, hecha, rechazada = false) =>
  aprobada ? 'border-operativa bg-operativa/10' : hecha ? 'border-seguridad bg-seguridad/10' : rechazada ? 'border-alarma bg-alarma/5' : 'border-acero/20';

const fueRechazada = (dev, hecha, aprobada) => dev?.resultado === 'rechazada' && !hecha && !aprobada;

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
  const { asistencia, hechas, aprobadas, guardarAsistencia, devoluciones } = usePlant();
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
    <li className={`p-3 rounded-md border-2 ${estilo(aprobada, hecha, fueRechazada(devoluciones[t.id], hecha, aprobada))}`}>
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
      <div className="sm:pl-10"><Devolucion dev={devoluciones[t.id]} hecha={hecha} aprobada={aprobada} /></div>
    </li>
  );
}

export default function Checklist({ momento, titulo, ayuda }) {
  const {
    tareas, hechas, aprobadas, toggleTarea, plantaOperativa, plantaCerrada, plantaEdFisica,
    puntosChecklist, puntosCierre, puntosEdFisica, devoluciones,
  } = usePlant();
  const lista = tareas.filter((t) => t.momento === momento);
  const completadas = lista.filter((t) => aprobadas[t.id]).length;
  const completo = { apertura: plantaOperativa, edfisica: plantaEdFisica, cierre: plantaCerrada }[momento];
  const puntos = { apertura: puntosChecklist, edfisica: puntosEdFisica, cierre: puntosCierre }[momento];
  const exito = MENSAJES_EXITO[momento];
  const idTitulo = `titulo-${momento}`;

  return (
    <section aria-labelledby={idTitulo} className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 id={idTitulo} className="flex items-center gap-2 font-display text-3xl font-bold">
          {momento === 'edfisica' && <Dumbbell className="size-7 shrink-0" aria-hidden="true" />}
          {titulo}
        </h2>
        <span className="font-medium tabular-nums">{completadas} de {lista.length} aprobadas</span>
      </div>
      {ayuda && <p className="-mt-2 mb-4 text-sm text-acero/70">{ayuda}</p>}

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
                className={`flex items-center gap-3 p-3 rounded-md border-2 ${aprobada ? 'cursor-default' : 'cursor-pointer'} transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-seguridad/60 ${estilo(aprobada, hecha, fueRechazada(devoluciones[t.id], hecha, aprobada))} ${
                  !aprobada && !hecha ? 'hover:border-acero' : ''
                }`}
              >
                {/* Una tarea aprobada por el docente ya no se puede destildar */}
                <input type="checkbox" checked={hecha} disabled={aprobada} onChange={() => toggleTarea(t.id)} className="sr-only" />
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
                  <Devolucion dev={devoluciones[t.id]} hecha={hecha} aprobada={aprobada} />
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
            <p className="font-display text-2xl font-bold leading-tight">{exito.titulo}</p>
            <p className="text-sm">{exito.detalle}. Tu equipo suma {puntos} puntos.</p>
          </div>
        </div>
      )}
    </section>
  );
}
