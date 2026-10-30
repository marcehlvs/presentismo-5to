import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// El navegador avisa una sola vez que la app se puede instalar: se guarda acá para usarlo cuando se toque el botón
let ofertaGuardada = null;
const oyentes = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ofertaGuardada = e;
    oyentes.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    ofertaGuardada = null;
    oyentes.forEach((f) => f());
  });
}

const yaInstalada = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const esIPhone = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Botón "Instalar app" (Android y computadoras). En iPhone/iPad no existe ese botón: se explica el paso a mano.
export default function BotonInstalar() {
  const [, repintar] = useState(0);
  useEffect(() => {
    const f = () => repintar((n) => n + 1);
    oyentes.add(f);
    return () => oyentes.delete(f);
  }, []);

  if (yaInstalada()) return null;
  if (ofertaGuardada) {
    const instalar = async () => {
      ofertaGuardada.prompt();
      await ofertaGuardada.userChoice.catch(() => {});
      ofertaGuardada = null;
      repintar((n) => n + 1);
    };
    return (
      <button type="button" onClick={instalar} className="mx-auto flex items-center gap-1.5 text-sm underline text-acero/70 hover:text-acero">
        <Download className="size-4" aria-hidden="true" />Instalar la app en este dispositivo
      </button>
    );
  }
  if (esIPhone()) {
    return <p className="text-center text-sm text-acero/70">Para instalarla: tocá Compartir y elegí “Agregar a inicio”.</p>;
  }
  return null;
}
