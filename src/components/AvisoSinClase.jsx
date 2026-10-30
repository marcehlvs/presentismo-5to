import { CalendarOff } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

// Aparece solo si el docente marcó hoy como día sin clase
export default function AvisoSinClase({ className = '' }) {
  const { diaHoy } = usePlant();
  if (!diaHoy?.sinClase) return null;
  return (
    <p role="status" className={`flex items-start gap-2 rounded-md border-2 border-acero bg-seguridad px-4 py-3 font-semibold text-acero ${className}`}>
      <CalendarOff className="size-6 shrink-0" aria-hidden="true" />
      <span>
        Hoy no hay clase{diaHoy.motivo ? `: ${diaHoy.motivo}` : ''}. Este día no suma puntos ni cuenta para el promedio de ningún equipo.
      </span>
    </p>
  );
}
