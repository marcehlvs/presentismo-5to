import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { btn, campo } from './estilos';

// Una tarea del checklist dentro de la jornada de un Jefe, con aprobar / rechazar y comentario opcional.
// Sirve para la jornada de hoy y también para las de días anteriores (bandeja de pendientes).
export default function FilaTareaDocente({ j, t }) {
  const { aprobarTarea, rechazarTarea, desafioHoy, sinClaseDe, esDocenteEF, fecha } = usePlant();
  const [texto, setTexto] = useState('');
  const sinClase = sinClaseDe(j.fecha);
  const declarada = !!j.declaradas?.[t.id];
  const aprobada = !!j.aprobadas?.[t.id];
  const dev = j.devoluciones?.[t.id];
  const sinDesafio = t.id === 'desafio' && j.fecha === fecha && !desafioHoy && !aprobada;
  // La cuenta de Ed. Física no puede restar puntos: si ya se sumaron, la aprobación la quita un docente
  const bloqueadaEF = esDocenteEF && aprobada && !!j.premioEdFisica;

  const aprobar = async () => {
    await aprobarTarea(j, t.id, !aprobada, texto);
    setTexto('');
  };
  const rechazar = async () => {
    await rechazarTarea(j, t.id, texto);
    setTexto('');
  };

  const tituloAprobar = sinClase
    ? 'Ese día no hubo clase'
    : sinDesafio
      ? 'Publicá primero el desafío de hoy'
      : bloqueadaEF
        ? 'Ya se sumaron los puntos de Ed. Física: pedile a un docente que quite la aprobación'
        : aprobada
          ? 'Quitar la aprobación (si el bloque ya sumó puntos, se le restan al equipo)'
          : undefined;

  return (
    <li className="p-3 rounded-md border-2 border-acero/20">
      <div className="flex items-center justify-between gap-3">
        <span>
          <span className="block font-semibold">{t.titulo}</span>
          <span className="block text-sm text-acero/70">
            {t.id === 'asistencia' && j.asistencia
              ? `Presentes: ${j.asistencia.presentes} · Llegadas tarde: ${j.asistencia.tardes}`
              : declarada ? 'Marcada por el alumno' : 'Sin marcar'}
          </span>
        </span>
        <span className="flex shrink-0 gap-2">
          <button
            onClick={aprobar}
            disabled={sinClase || sinDesafio || bloqueadaEF}
            title={tituloAprobar}
            className={`${btn} ${aprobada ? 'bg-operativa text-white border-operativa' : ''}`}
          >
            {aprobada ? 'Aprobada ✓' : 'Aprobar'}
          </button>
          <button
            onClick={rechazar}
            disabled={sinClase || aprobada || (!declarada && !texto.trim())}
            title={!declarada && !aprobada && !texto.trim() ? 'El alumno no la marcó: escribí un comentario para avisarle qué falta' : undefined}
            className={`${btn} text-alarma border-alarma`}
          >
            Rechazar
          </button>
        </span>
      </div>
      {dev && (
        <p className={`mt-2 text-sm ${dev.resultado === 'rechazada' ? 'text-alarma' : 'text-operativa'}`}>
          <b>{dev.resultado === 'rechazada' ? 'Rechazada' : 'Aprobada'}:</b> {dev.texto || 'sin comentario'}
        </p>
      )}
      <label className="mt-2 block">
        <span className="sr-only">Comentario para el equipo sobre {t.titulo}</span>
        <input
          value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} disabled={sinClase}
          placeholder="Comentario para el equipo (opcional)" className={`${campo} !py-1 text-sm`}
        />
      </label>
    </li>
  );
}
