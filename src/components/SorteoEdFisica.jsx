import { usePlant } from '../context/PlantContext';
import { etiquetaDia } from '../lib/semanas';
import { btn } from './estilos';

// Docente: en los días de Ed. Física se sortea qué equipo hace el checklist de Ed. Física y suma esos puntos.
// Rotación: no repite hasta que salieron los cinco. Se puede cambiar a mano (por ejemplo, si el sorteado faltó).
export default function SorteoEdFisica() {
  const { hoyEdFisica, nuevoModelo, fecha, alumnos, sorteoHoy, sortearEdFisica, elegirEdFisica, quitarSorteoEF, faltanEF, puntosEdFisica } = usePlant();
  if (!hoyEdFisica || !nuevoModelo) return null;
  const sorteado = alumnos.find((a) => a.id === sorteoHoy?.jefeId);
  return (
    <section aria-labelledby="titulo-sorteo-ef" className="bg-white border-2 border-operativa rounded-lg p-5">
      <h2 id="titulo-sorteo-ef" className="font-display text-3xl font-bold mb-1">Educación Física de hoy</h2>
      <p className="text-sm text-acero/70 mb-3">
        {etiquetaDia(fecha)}: se sortea un líder y su equipo hace el checklist de Ed. Física (+{puntosEdFisica} puntos). No repite hasta que salieron los cinco.
      </p>
      {sorteado ? (
        <>
          <p role="status" className="text-xl font-semibold">Le toca a {sorteado.nombre}{sorteoHoy.manual ? ' (elegido a mano)' : ''}.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium" htmlFor="cambiar-ef">Cambiar a:</label>
            <select id="cambiar-ef" value={sorteado.id} onChange={(e) => elegirEdFisica(Number(e.target.value))} className="border-2 border-acero rounded-md px-2 py-1">
              {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            <button onClick={() => quitarSorteoEF()} className={`${btn} bg-white`}>Deshacer sorteo</button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-3">Todavía no se sorteó. Faltan salir: {faltanEF.map((id) => alumnos.find((a) => a.id === id)?.nombre ?? id).join(', ')}.</p>
          <button onClick={() => sortearEdFisica()} className={`${btn} bg-acero text-seguridad`}>Sortear líder de Ed. Física</button>
        </>
      )}
    </section>
  );
}
