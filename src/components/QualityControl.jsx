import { useState } from 'react';
import { Calculator, CircleCheck, CircleX, Lightbulb } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

export default function QualityControl() {
  const { jornada, verificarDesafio, desafioResuelto, puntosDesafio } = usePlant();
  const [valor, setValor] = useState('');
  const [resultado, setResultado] = useState(null); // null | 'ok' | 'error'
  const [intentos, setIntentos] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor.trim()) return;
    const ok = verificarDesafio(valor);
    setResultado(ok ? 'ok' : 'error');
    if (!ok) setIntentos((n) => n + 1);
  };

  return (
    <section aria-labelledby="titulo-calidad" className="bg-white border-2 border-acero rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="size-7" aria-hidden="true" />
        <h2 id="titulo-calidad" className="font-display text-3xl font-bold">Control de calidad</h2>
      </div>

      <p className="text-lg mb-4 max-w-prose">{jornada.desafio.enunciado}</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="resultado" className="sr-only">Resultado del desafío</label>
        <input
          id="resultado"
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(e) => { setValor(e.target.value); setResultado(null); }}
          disabled={desafioResuelto}
          placeholder="Tu resultado"
          className="flex-1 border-2 border-acero rounded-md px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-seguridad/60 disabled:bg-hormigon"
        />
        <button
          type="submit"
          disabled={desafioResuelto || !valor.trim()}
          className="bg-acero text-seguridad font-display text-2xl font-bold px-6 py-2 rounded-md transition enabled:hover:bg-seguridad enabled:hover:text-acero border-2 border-acero disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60"
        >
          Verificar
        </button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-8">
        {desafioResuelto && (
          <p className="anim-exito flex items-center gap-2 text-operativa font-semibold">
            <CircleCheck className="size-5" aria-hidden="true" />
            Pieza aprobada. Tu turno suma {puntosDesafio} puntos.
          </p>
        )}
        {resultado === 'error' && !desafioResuelto && (
          <p className="flex items-center gap-2 text-alarma font-semibold">
            <CircleX className="size-5" aria-hidden="true" />
            Pieza rechazada. Revisá el cálculo e intentá de nuevo.
          </p>
        )}
        {intentos >= 2 && !desafioResuelto && (
          <p className="flex items-center gap-2 mt-1 text-acero/80">
            <Lightbulb className="size-5 text-seguridad" aria-hidden="true" />
            Pista: {jornada.desafio.pista}
          </p>
        )}
      </div>
    </section>
  );
}
