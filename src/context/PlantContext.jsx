import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ALUMNOS, TURNOS, TAREAS, PUNTAJES_INICIALES, getJornada } from '../data/mockData';

const PlantContext = createContext(null);

const PUNTOS_CHECKLIST = 10;
const PUNTOS_DESAFIO = 15;

export function PlantProvider({ children }) {
  const [jefeId, setJefeId] = useState(null);
  const [hechas, setHechas] = useState({});
  const [desafioResuelto, setDesafioResuelto] = useState(false);
  const [premioChecklist, setPremioChecklist] = useState(false);
  const [puntajes, setPuntajes] = useState(PUNTAJES_INICIALES);

  const jornada = useMemo(getJornada, []);
  const jefe = ALUMNOS.find((a) => a.id === jefeId) ?? null;
  const plantaOperativa = TAREAS.every((t) => hechas[t.id]);

  const sumarPuntos = useCallback((turnoId, cantidad) => {
    setPuntajes((p) => ({ ...p, [turnoId]: p[turnoId] + cantidad }));
  }, []);

  // Premio por completar el checklist (una sola vez por jornada)
  useEffect(() => {
    if (plantaOperativa && jefe && !premioChecklist) {
      sumarPuntos(jefe.turno, PUNTOS_CHECKLIST);
      setPremioChecklist(true);
    }
  }, [plantaOperativa, jefe, premioChecklist, sumarPuntos]);

  const iniciarTurno = (id) => setJefeId(id);

  const cerrarTurno = () => {
    setJefeId(null);
    setHechas({});
    setDesafioResuelto(false);
    setPremioChecklist(false);
  };

  const toggleTarea = (id) => setHechas((h) => ({ ...h, [id]: !h[id] }));

  const verificarDesafio = (valor) => {
    const numero = parseFloat(String(valor).replace(',', '.'));
    const correcto = Math.abs(numero - jornada.desafio.respuesta) < 0.001;
    if (correcto && !desafioResuelto && jefe) {
      setDesafioResuelto(true);
      sumarPuntos(jefe.turno, PUNTOS_DESAFIO);
    }
    return correcto;
  };

  const ranking = useMemo(
    () =>
      TURNOS.map((t) => ({ ...t, puntos: puntajes[t.id] })).sort((a, b) => b.puntos - a.puntos),
    [puntajes]
  );

  const value = {
    alumnos: ALUMNOS, tareas: TAREAS, jornada, jefe, hechas, plantaOperativa,
    desafioResuelto, ranking, puntosDesafio: PUNTOS_DESAFIO, puntosChecklist: PUNTOS_CHECKLIST,
    iniciarTurno, cerrarTurno, toggleTarea, verificarDesafio,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlant debe usarse dentro de <PlantProvider>');
  return ctx;
}
