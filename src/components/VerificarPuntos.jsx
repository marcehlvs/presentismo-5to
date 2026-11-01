import { useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { compararPuntos, hayDescuadre } from '../lib/verificarPuntos';
import { btn } from './estilos';

// Compara el contador de puntos de cada equipo (lo que ven los alumnos en la tabla) con el total calculado desde las jornadas y los bonos
export default function VerificarPuntos() {
  const { historial, bonosTodos, puntajes, corregirPuntos } = usePlant();
  const [estado, setEstado] = useState('');
  const filas = useMemo(() => compararPuntos({ jornadas: historial, bonos: bonosTodos, puntajes }), [historial, bonosTodos, puntajes]);
  const descuadre = hayDescuadre(filas);

  const corregir = async (lista) => {
    const msg = lista.length === 1
      ? `¿Dejar el contador de ${lista[0].nombre} en ${lista[0].calculado} puntos (hoy tiene ${lista[0].contador})?`
      : `¿Corregir el contador de ${lista.length} equipos con el total calculado desde las jornadas y los bonos?`;
    if (!window.confirm(msg)) return;
    setEstado('guardando');
    const resultados = await Promise.all(lista.map((f) => corregirPuntos(f.id, f.calculado)));
    setEstado(resultados.every(Boolean) ? 'ok' : '');
  };

  const th = 'text-left font-semibold px-2 py-1 border-b-2 border-acero';
  const td = 'px-2 py-1 border-b border-acero/15 tabular-nums';

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Verificar puntos</h2>
      <p className="text-sm text-acero/70 mb-3">
        La tabla de posiciones usa un contador por equipo; el resumen semanal se calcula desde las jornadas y los bonos. Acá se comparan: si no
        coinciden, el total calculado es el correcto (incluye los días sin clase que ya tenían puntos) y podés corregir el contador.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th className={th}>Equipo</th><th className={th}>Contador (tabla)</th><th className={th}>Calculado</th><th className={th}>Diferencia</th><th className={th}><span className="sr-only">Acción</span></th></tr></thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className={f.diferencia !== 0 ? 'bg-alarma/10' : ''}>
                <td className={td}>{f.nombre}</td>
                <td className={td}>{f.contador}</td>
                <td className={td}>{f.calculado}</td>
                <td className={`${td} font-semibold`}>{f.diferencia === 0 ? '✓' : f.diferencia > 0 ? `+${f.diferencia}` : f.diferencia}</td>
                <td className={td}>{f.diferencia !== 0 && <button onClick={() => corregir([f])} className="underline text-alarma">Corregir</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {descuadre ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm font-semibold text-alarma">Hay equipos con el contador distinto del total calculado.</p>
          <button onClick={() => corregir(filas.filter((f) => f.diferencia !== 0))} disabled={estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>Corregir todos</button>
        </div>
      ) : (
        <p role="status" className="mt-3 text-sm font-semibold text-operativa">Los puntos coinciden en los cinco equipos ✓</p>
      )}
      {estado === 'ok' && <p role="status" className="mt-2 text-operativa font-semibold">Corregido ✓</p>}
    </section>
  );
}
