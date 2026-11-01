import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Campo de contraseña o PIN con botón para mostrar u ocultar lo que se escribe.
// Recibe las mismas props que un <input>; `className` es el estilo del campo.
export default function CampoClave({ className = '', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar lo que escribís' : 'Mostrar lo que escribís'}
        className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-acero/70 hover:text-acero focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60 rounded-md"
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  );
}
