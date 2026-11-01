import { useRef } from 'react';
import { siguienteSolapa } from '../lib/solapas';

// Solapas accesibles (rol tablist, flechas del teclado). Todos los paneles quedan montados y los inactivos solo se ocultan:
// así no se pierde lo que se estaba escribiendo en un formulario al cambiar de solapa.
export default function Solapas({ solapas, activa, onCambiar }) {
  const botones = useRef({});
  const ids = solapas.map((s) => s.id);

  const alTeclear = (e) => {
    const destino = siguienteSolapa(ids, activa, e.key);
    if (!destino) return;
    e.preventDefault();
    onCambiar(destino);
    botones.current[destino]?.focus();
  };

  return (
    <>
      <div className="sticky top-0 z-20 py-2 bg-hormigon">
        <div role="tablist" aria-label="Secciones del panel docente" onKeyDown={alTeclear} className="flex gap-2 overflow-x-auto pb-1">
          {solapas.map((s) => {
            const esta = s.id === activa;
            return (
              <button
                key={s.id} ref={(el) => { botones.current[s.id] = el; }}
                role="tab" id={`solapa-${s.id}`} aria-selected={esta} aria-controls={`panel-${s.id}`} tabIndex={esta ? 0 : -1}
                onClick={() => onCambiar(s.id)}
                className={`shrink-0 whitespace-nowrap rounded-md border-2 border-acero px-4 py-2.5 font-display text-lg font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60 ${esta ? 'bg-acero text-seguridad' : 'bg-white text-acero hover:bg-seguridad/30'}`}
              >
                {s.titulo}
              </button>
            );
          })}
        </div>
      </div>
      {solapas.map((s) => (
        <div key={s.id} role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`solapa-${s.id}`} hidden={s.id !== activa} className="space-y-6 min-w-0">
          {s.contenido}
        </div>
      ))}
    </>
  );
}
