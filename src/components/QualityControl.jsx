import { useState } from 'react';
import { Calculator, CircleCheck, CircleX, Hourglass, Lightbulb } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

export default function QualityControl() {
  const { jornada, enviarRespuesta, respuestaEnviada, rechazos, desafioResuelto, puntosDesafio } = usePlant();
  const [valor, setValor] = useState('');
  const bloqueado = desafioResuelto || respuestaEnviada !== null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valor.trim()) return;
    enviarRespuesta(valor);
    setValor('');
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
          id="resultado" type="text" inputMode="decimal" maxLength={20} value={valor}
          onChange={(e) => setValor(e.target.value)} disabled={bloqueado} placeholder="Tu resultado"
          className="flex-1 border-2 border-acero rounded-md px-3 py-2.5 focus:outline-none focus:ring-4 focus:ring-seguridad/60 disabled:bg-hormigon"
        />
        <button
          type="submit" disabled={bloqueado || !valor.trim()}
          className="bg-acero text-seguridad font-display text-2xl font-bold px-6 py-2 rounded-md transition enabled:hover:bg-seguridad enabled:hover:text-acero border-2 border-acero disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60"
        >
          Enviar
        </button>
      </form>

      <div aria-live="polite" className="mt-3 min-h-8">
        {desafioResuelto && (
          <p className="anim-exito flex items-center gap-2 text-operativa font-semibold">
            <CircleCheck className="size-5" aria-hidden="true" />
            Pieza aprobada por el docente. Tu turno suma {puntosDesafio} puntos.
          </p>
        )}
        {!desafioResuelto && respuestaEnviada !== null && (
          <p className="flex items-center gap-2 font-semibold">
            <Hourglass className="size-5" aria-hidden="true" />
            Respuesta enviada ({respuestaEnviada}). Esperando revisión del docente.
          </p>
        )}
        {!desafioResuelto && respuestaEnviada === null && rechazos > 0 && (
          <p className="flex items-center gap-2 text-alarma font-semibold">
            <CircleX className="size-5" aria-hidden="true" />
            Pieza rechazada. Revisá el cálculo y enviala de nuevo.
          </p>
        )}
        {rechazos >= 2 && !desafioResuelto && (
          <p className="flex items-center gap-2 mt-1 text-acero/80">
            <Lightbulb className="size-5 text-seguridad" aria-hidden="true" />
            Pista: {jornada.desafio.pista}
          </p>
        )}
      </div>
    </section>
  );
}
