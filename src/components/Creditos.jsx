import { AUTOR, VERSION } from '../lib/version';

// Pie con la versión y la autoría de la aplicación
export default function Creditos({ className = '' }) {
  return (
    <p className={`text-center text-xs text-acero/60 ${className}`}>
      Operación: Jefe de Planta · versión {VERSION} · Desarrollada por {AUTOR}
    </p>
  );
}
