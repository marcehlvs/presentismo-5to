import { usePlant } from '../context/PlantContext';
import { MOMENTOS } from '../data/mockData';
import FilaTareaDocente from './FilaTareaDocente';
import AvisoSinClase from './AvisoSinClase';

// Panel de la cuenta docente de Ed. Física (docentes/{uid} con rol = 'edfisica'): solo ve y aprueba el bloque de Ed. Física
// de cada líder. No publica desafíos, no carga bonos ni toca el resto del panel.
export default function PanelEdFisica() {
  const { jornadasHoy, alumnos, tareas, logoutDocente, jornada, error, hoyEdFisica, suplentesHoy, puntosEdFisica } = usePlant();
  // Solo las tareas propias de Ed. Física (las que agrega el docente general no se aprueban desde acá)
  const tareasEF = tareas.filter((t) => t.momento === 'edfisica' && t.id.startsWith('ef_'));

  return (
    <div className="min-h-screen">
      <header className="bg-acero text-white">
        <div className="franja-peligro h-3" />
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-bold leading-none">Educación Física</p>
            <p className="text-white/75 mt-1">{jornada.diaNombre}</p>
          </div>
          <button onClick={logoutDocente} className="px-3 py-2 rounded-md border border-white/40 hover:bg-white/10">Cerrar sesión</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {error && <p role="alert" className="text-alarma font-semibold">{error}</p>}
        <AvisoSinClase />
        {!hoyEdFisica ? (
          <p className="bg-white border-2 border-acero rounded-lg p-5">Hoy no hay Educación Física. Los lunes y viernes aparece sola.</p>
        ) : jornadasHoy.length === 0 ? (
          <p className="bg-white border-2 border-acero rounded-lg p-5">Todavía no hay actividad del líder de hoy.</p>
        ) : (
          jornadasHoy.map((j) => {
            const alumno = alumnos.find((a) => a.id === j.jefeId);
            const suplente = suplentesHoy[String(j.jefeId)];
            return (
              <section key={j.id} className="bg-white border-2 border-acero rounded-lg p-5">
                <h2 className="font-display text-3xl font-bold mb-3">
                  {alumno?.nombre ?? `Jefe ${j.jefeId}`}
                  {suplente && <span className="block font-sans text-base font-medium text-acero/70">Hoy lo reemplaza {suplente}.</span>}
                </h2>
                <h3 className="font-display text-xl font-bold mb-2">{MOMENTOS.edfisica}</h3>
                <ul className="space-y-2">
                  {tareasEF.map((t) => <FilaTareaDocente key={t.id} j={j} t={t} />)}
                </ul>
                {j.premioEdFisica && <p className="mt-2 text-sm text-operativa font-semibold">Educación Física completa: {puntosEdFisica} puntos ya sumados al equipo.</p>}
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}