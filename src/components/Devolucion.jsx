import { MessageSquareText } from 'lucide-react';

// Comentario del docente sobre una tarea o el desafío.
// Se muestra si la tarea fue rechazada (y todavía no se volvió a marcar) o si fue aprobada con comentario.
export default function Devolucion({ dev, hecha, aprobada, rechazo = 'Rechazada por el docente' }) {
  if (!dev) return null;
  const rechazada = dev.resultado === 'rechazada' && !hecha && !aprobada;
  const comentada = dev.resultado === 'aprobada' && aprobada && !!dev.texto;
  if (!rechazada && !comentada) return null;
  return (
    <span role="status" className={`mt-1 flex items-start gap-1.5 text-sm font-medium ${rechazada ? 'text-alarma' : 'text-operativa'}`}>
      <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{rechazada ? rechazo : 'Comentario del docente'}{dev.texto ? `: ${dev.texto}` : '.'}</span>
    </span>
  );
}
