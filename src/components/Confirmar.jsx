import { useCallback, useEffect, useRef, useState } from 'react';
import { btn } from './estilos';

// Reemplazo de window.confirm con un cuadro propio (el del navegador queda feo y se ve distinto en cada celular).
// Uso: const [confirmar, dialogo] = useConfirmar();  ...  if (!(await confirmar('¿Seguro?'))) return;  ...  y renderizar {dialogo}.
export function useConfirmar() {
  const [pedido, setPedido] = useState(null);
  const confirmar = useCallback((mensaje, { aceptar = 'Confirmar', peligro = false } = {}) =>
    new Promise((resolver) => setPedido({ mensaje, aceptar, peligro, resolver })), []);
  const cerrar = (v) => { pedido?.resolver(v); setPedido(null); };
  return [confirmar, pedido ? <Dialogo pedido={pedido} cerrar={cerrar} /> : null];
}

function Dialogo({ pedido, cerrar }) {
  const cancelar = useRef(null);
  useEffect(() => {
    cancelar.current?.focus();
    const tecla = (e) => { if (e.key === 'Escape') cerrar(false); };
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => cerrar(false)}>
      <div role="alertdialog" aria-modal="true" aria-label="Confirmar" onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border-2 border-acero bg-white p-5 shadow-xl">
        <p className="text-lg font-semibold">{pedido.mensaje}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelar} type="button" onClick={() => cerrar(false)} className={`${btn} bg-white`}>Cancelar</button>
          <button type="button" onClick={() => cerrar(true)} className={`${btn} ${pedido.peligro ? 'bg-alarma text-white border-alarma' : 'bg-acero text-seguridad'}`}>{pedido.aceptar}</button>
        </div>
      </div>
    </div>
  );
}
