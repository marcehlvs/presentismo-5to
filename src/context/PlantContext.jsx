import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection, deleteField, doc, getDoc, increment, onSnapshot, query, runTransaction, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ALUMNOS, TURNOS, TAREAS, PUNTAJES_INICIALES, getJornada, jefeDelDia } from '../data/mockData';

const PlantContext = createContext(null);

const PUNTOS_CHECKLIST = 10;
const PUNTOS_DESAFIO = 15;
const SESION_KEY = 'jefe-de-planta:sesion';
// true: al recargar la página el dispositivo recuerda quién es el Jefe de hoy. false: siempre se vuelve a elegir.
const RECORDAR_SESION = false;

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// La sesión del Jefe (quién es hoy en este dispositivo) es local; puntos y progreso viven en Firestore.
function leerSesion(fecha) {
  if (!RECORDAR_SESION) return null;
  try {
    const s = JSON.parse(localStorage.getItem(SESION_KEY));
    if (s?.fecha === fecha && ALUMNOS.some((a) => a.id === s.jefeId)) return s.jefeId;
  } catch { /* sin almacenamiento */ }
  return null;
}

// Traduce el error de Firebase a un mensaje útil (y lo deja en la consola del navegador)
function mensajeError(e) {
  console.error('[Firebase]', e?.code ?? '', e);
  switch (e?.code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firestore rechazó la operación: revisá que las reglas estén publicadas.';
    case 'auth/operation-not-allowed':
      return 'Falta activar el acceso Anónimo en Firebase > Authentication.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return 'La configuración de Firebase (.env) es inválida.';
    case 'unavailable':
      return 'Sin conexión con el servidor.';
    default:
      return `Error de conexión (${e?.code ?? 'desconocido'}).`;
  }
}

const turnoDe = (jefeId) => ALUMNOS.find((a) => a.id === jefeId)?.turno;

// Suma puntos a un turno dentro de una transacción (si el documento no existe, parte del puntaje inicial)
async function leerTurno(tx, turnoId) {
  const ref = doc(db, 'turnos', turnoId);
  return { ref, existe: (await tx.get(ref)).exists(), turnoId };
}
const sumar = (tx, t, n) => tx.set(t.ref, { puntos: t.existe ? increment(n) : PUNTAJES_INICIALES[t.turnoId] + n });

export function PlantProvider({ children }) {
  const [fecha] = useState(hoyISO);
  const [user, setUser] = useState(null);
  const [esDocente, setEsDocente] = useState(false);
  const [authListo, setAuthListo] = useState(false);
  const [error, setError] = useState('');
  const [puntajes, setPuntajes] = useState({});
  const [jornadasHoy, setJornadasHoy] = useState([]);
  const [jefeId, setJefeId] = useState(() => leerSesion(fecha));

  // Sesión: anónima para los alumnos; con email para el docente (debe figurar en /docentes/{uid})
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (!u) {
          setUser(null);
          setEsDocente(false);
          try { await signInAnonymously(auth); } catch (e) { setError(mensajeError(e)); setAuthListo(true); }
          return;
        }
        let docente = false;
        if (!u.isAnonymous) {
          try { docente = (await getDoc(doc(db, 'docentes', u.uid))).exists(); } catch { docente = false; }
        }
        setEsDocente(docente);
        setUser(u);
        setAuthListo(true);
      }),
    []
  );

  // Tiempo real: puntajes de los turnos y jornadas de hoy
  useEffect(() => {
    if (!user) return undefined;
    const fallo = (e) => setError(mensajeError(e));
    const off1 = onSnapshot(collection(db, 'turnos'), (s) => {
      const p = {};
      s.forEach((d) => { p[d.id] = d.data().puntos; });
      setPuntajes(p);
      setError('');
    }, fallo);
    const off2 = onSnapshot(query(collection(db, 'jornadas'), where('fecha', '==', fecha)), (s) => {
      setJornadasHoy(s.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, fallo);
    return () => { off1(); off2(); };
  }, [user, fecha]);

  const jornada = useMemo(getJornada, []);
  const jefe = ALUMNOS.find((a) => a.id === jefeId) ?? null;
  const actual = jornadasHoy.find((j) => j.jefeId === jefeId) ?? {};
  const hechas = actual.declaradas ?? {};
  const aprobadas = actual.aprobadas ?? {};
  const plantaOperativa = TAREAS.every((t) => aprobadas[t.id]);

  const ranking = useMemo(
    () => TURNOS.map((t) => ({ ...t, puntos: puntajes[t.id] ?? PUNTAJES_INICIALES[t.id] })).sort((a, b) => b.puntos - a.puntos),
    [puntajes]
  );

  const guardar = (id, datos) =>
    setDoc(doc(db, 'jornadas', `${fecha}_${id}`), { fecha, jefeId: id, ...datos }, { merge: true })
      .catch((e) => setError(mensajeError(e)));

  // ---- Alumno: declara tareas y envía su respuesta; no suma puntos por su cuenta ----
  const iniciarTurno = (id) => {
    setJefeId(id);
    if (RECORDAR_SESION) try { localStorage.setItem(SESION_KEY, JSON.stringify({ fecha, jefeId: id })); } catch { /* sin almacenamiento */ }
  };
  const cerrarTurno = () => {
    setJefeId(null);
    try { localStorage.removeItem(SESION_KEY); } catch { /* sin almacenamiento */ }
  };
  const toggleTarea = (tareaId) => guardar(jefeId, { declaradas: { [tareaId]: !hechas[tareaId] } });
  const enviarRespuesta = (valor) => guardar(jefeId, { respuesta: String(valor).trim().slice(0, 20) });

  // ---- Docente: aprueba y recién ahí se suman los puntos (una vez por jornada) ----
  const aprobarTarea = (j, tareaId, valor) =>
    runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      const nuevas = { ...(d.aprobadas ?? {}), [tareaId]: valor };
      const cambios = { aprobadas: nuevas };
      if (TAREAS.every((t) => nuevas[t.id]) && !d.premioChecklist) {
        const t = await leerTurno(tx, turnoDe(d.jefeId));
        cambios.premioChecklist = true;
        sumar(tx, t, PUNTOS_CHECKLIST);
      }
      tx.update(ref, cambios);
    }).catch((e) => setError(mensajeError(e)));

  const aprobarDesafio = (j) =>
    runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      if (d.desafioAprobado) return;
      const t = await leerTurno(tx, turnoDe(d.jefeId));
      sumar(tx, t, PUNTOS_DESAFIO);
      tx.update(ref, { desafioAprobado: true });
    }).catch((e) => setError(mensajeError(e)));

  const rechazarDesafio = (j) =>
    updateDoc(doc(db, 'jornadas', j.id), { respuesta: deleteField(), rechazos: increment(1) })
      .catch((e) => setError(mensajeError(e)));

  const loginDocente = (email, clave) => signInWithEmailAndPassword(auth, email, clave);
  const logoutDocente = () => signOut(auth);

  const value = {
    alumnos: ALUMNOS, tareas: TAREAS, jornada, jefe, jefeSugerido: jefeDelDia(), hechas, aprobadas, plantaOperativa,
    desafioResuelto: actual.desafioAprobado === true, respuestaEnviada: actual.respuesta ?? null, rechazos: actual.rechazos ?? 0,
    ranking, puntosDesafio: PUNTOS_DESAFIO, puntosChecklist: PUNTOS_CHECKLIST,
    iniciarTurno, cerrarTurno, toggleTarea, enviarRespuesta,
    authListo, esDocente, cuentaSinPermiso: !!user && !user.isAnonymous && !esDocente, error,
    jornadasHoy, aprobarTarea, aprobarDesafio, rechazarDesafio, loginDocente, logoutDocente,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlant debe usarse dentro de <PlantProvider>');
  return ctx;
}
