import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { btn, campo } from './estilos';

// Respuesta del alumno al desafío del día: aprobar o rechazar, con comentario opcional
export default function RevisionDesafio({ j }) {
  const { aprobarDesafio, rechazarDesafio, criterioDocente, sinClaseDe, fecha } = usePlant();
  const [texto, setTexto] = useState('');
  const sinClase = sinClaseDe(j.fecha);
  const dev = j.devoluciones?.respuesta;

  const revisar = async (accion) => {
    await accion(j, texto);
    setTexto('');
  };

  return (
    <div className="mt-5 p-3 rounded-md border-2 border-acero/20">
      <p className="font-semibold">Respuesta del alumno al desafío</p>
      {j.fecha === fecha && criterioDocente && <p className="text-sm text-acero/70 mt-1">Tu criterio: {criterioDocente}</p>}
      <p className="mt-2 whitespace-pre-line">
        <b>{j.respuesta ?? (j.desafioAprobado ? '(aprobada)' : 'sin enviar')}</b>
      </p>
      {dev && (
        <p className={`mt-2 text-sm ${dev.resultado === 'rechazada' ? 'text-alarma' : 'text-operativa'}`}>
          <b>Último comentario ({dev.resultado === 'rechazada' ? 'rechazo' : 'aprobación'}):</b> {dev.texto || 'sin comentario'}
        </p>
      )}
      {j.desafioAprobado ? (
        <p className="mt-2 text-operativa font-semibold">Aprobado: puntos ya sumados al equipo.</p>
      ) : (
        j.respuesta != null && (
          <div className="mt-3 space-y-2">
            <label className="block">
              <span className="sr-only">Comentario para el equipo sobre la respuesta</span>
              <input
                value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={200} disabled={sinClase}
                placeholder="Comentario para el equipo (opcional)" className={`${campo} !py-1 text-sm`}
              />
            </label>
            <div className="flex gap-2">
              <button onClick={() => revisar(aprobarDesafio)} disabled={sinClase} className={`${btn} bg-operativa text-white border-operativa`}>Aprobar</button>
              <button onClick={() => revisar(rechazarDesafio)} disabled={sinClase} className={`${btn} text-alarma border-alarma`}>Rechazar</button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
