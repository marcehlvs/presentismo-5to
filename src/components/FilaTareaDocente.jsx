import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { btn, campo } from './estilos';

// Una tarea del checklist dentro de la jornada de un Jefe, con aprobar / rechazar y comentario opcional
export default function FilaTareaDocente({ j, t }) {
  const { aprobarTarea, rechazarTarea, desafioHoy, hoySinClase } = usePlant();
  const [texto, setTexto] = useState('');
  const declarada = !!j.declaradas?.[t.id];
  const aprobada = !!j.aprobadas?.[t.id];
  const dev = j.devoluciones?.[t.id];
  const sinDesafio = t.id === 'desafio' && !desafioHoy && !aprobada;

  const aprobar = async () => {
    await aprobarTarea(j, t.id, !aprobada, texto);
    setTexto('');
  };
  const rechazar = async () => {
    await rechazarTarea(j, t.id, texto);
    setTexto('');
  };

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
            disabled={hoySinClase || sinDesafio}
            title={hoySinClase ? 'Hoy es día sin clase' : sinDesafio ? 'Publicá primero el desafío de hoy' : aprobada ? 'Quitar la aprobación' : undefined}
            className={`${btn} ${aprobada ? 'bg-operativa text-white border-operativa' : ''}`}
          >
            {aprobada ? 'Aprobada ✓' : 'Aprobar'}
          </button>
          <button
            onClick={rechazar}
            disabled={hoySinClase || !declarada || aprobada}
            title={!declarada && !aprobada ? 'El alumno todavía no la marcó' : undefined}
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
          value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} disabled={hoySinClase}
          placeholder="Comentario para el equipo (opcional)" className={`${campo} !py-1 text-sm`}
        />
      </label>
    </li>
  );
}
