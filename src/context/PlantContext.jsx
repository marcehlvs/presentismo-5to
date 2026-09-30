import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection, deleteField, doc, getDoc, increment, getDocs, onSnapshot, query, runTransaction, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { ALUMNOS, TURNOS, TAREAS, PUNTAJES_INICIALES, getJornada, jefeDelDia, IDS_EXTRA } from '../data/mockData';
import {
  PUNTOS_CHECKLIST, PUNTOS_CIERRE, PUNTOS_DESAFIO, lunesDe, resumenTurnos, sumarDias,
} from '../lib/semanas';

const PlantContext = createContext(null);

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
  const [jornadasSemana, setJornadasSemana] = useState([]); // toda la semana en curso
  const [premioSemana, setPremioSemana] = useState(null); // premio que carga el docente
  const [historial, setHistorial] = useState([]); // solo docente: todas las jornadas
  const [premios, setPremios] = useState([]); // solo docente: todos los premios semanales
  const [extras, setExtras] = useState([]); // tareas extra que agrega el docente para hoy
  const [desafioHoy, setDesafioHoy] = useState(null); // lo publica el docente
  const [criterioDocente, setCriterioDocente] = useState(''); // respuesta esperada: solo lo lee el docente
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
    const off3 = onSnapshot(doc(db, 'desafios', fecha), (s) => setDesafioHoy(s.exists() ? s.data() : null), fallo);
    const off4 = esDocente
      ? onSnapshot(doc(db, 'desafios_docente', fecha), (s) => setCriterioDocente(s.exists() ? s.data().respuestaEsperada ?? '' : ''), fallo)
      : () => {};
    const off5 = onSnapshot(doc(db, 'tareas_extra', fecha), (s) => setExtras(s.exists() ? s.data().items ?? [] : []), fallo);
    const lunes = lunesDe(fecha);
    const off6 = onSnapshot(
      query(collection(db, 'jornadas'), where('fecha', '>=', lunes), where('fecha', '<=', sumarDias(lunes, 6))),
      (s) => setJornadasSemana(s.docs.map((d) => ({ id: d.id, ...d.data() }))), fallo
    );
    const off7 = onSnapshot(doc(db, 'premios', lunes), (s) => setPremioSemana(s.exists() ? s.data() : null), fallo);
    const off8 = esDocente
      ? onSnapshot(collection(db, 'jornadas'), (s) => setHistorial(s.docs.map((d) => ({ id: d.id, ...d.data() }))), fallo)
      : () => {};
    const off9 = esDocente
      ? onSnapshot(collection(db, 'premios'), (s) => setPremios(s.docs.map((d) => ({ id: d.id, ...d.data() }))), fallo)
      : () => {};
    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); };
  }, [user, fecha, esDocente]);

  const jornada = useMemo(getJornada, []);
  const semana = lunesDe(fecha);
  const resumenSemana = useMemo(() => resumenTurnos(jornadasSemana), [jornadasSemana]);
  const jefe = ALUMNOS.find((a) => a.id === jefeId) ?? null;
  const actual = jornadasHoy.find((j) => j.jefeId === jefeId) ?? {};
  const hechas = actual.declaradas ?? {};
  const aprobadas = actual.aprobadas ?? {};
  const tareasDelDia = useMemo(
    () => [
      ...TAREAS,
      ...extras.map((x) => ({
        id: x.id, momento: x.momento === 'cierre' ? 'cierre' : 'apertura',
        titulo: x.titulo, detalle: 'Tarea agregada por el docente', icono: 'ClipboardList',
      })),
    ],
    [extras]
  );
  const completo = (momento, ap) => tareasDelDia.filter((t) => t.momento === momento).every((t) => ap[t.id]);
  const plantaOperativa = completo('apertura', aprobadas);
  const plantaCerrada = completo('cierre', aprobadas);

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
  const guardarAsistencia = (presentes, tardes) =>
    guardar(jefeId, { asistencia: { presentes, tardes }, declaradas: { asistencia: true } });
  const enviarRespuesta = (valor) => guardar(jefeId, { respuesta: String(valor).trim().slice(0, 200) });

  // ---- Docente: aprueba y recién ahí se suman los puntos (una vez por jornada) ----
  const aprobarTarea = (j, tareaId, valor) =>
    runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      const nuevas = { ...(d.aprobadas ?? {}), [tareaId]: valor };
      const cambios = { aprobadas: nuevas };
      let puntos = 0;
      if (completo('apertura', nuevas) && !d.premioChecklist) { cambios.premioChecklist = true; puntos += PUNTOS_CHECKLIST; }
      if (completo('cierre', nuevas) && !d.premioCierre) { cambios.premioCierre = true; puntos += PUNTOS_CIERRE; }
      if (puntos) sumar(tx, await leerTurno(tx, turnoDe(d.jefeId)), puntos);
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

  // Docente: publica el desafío del día (el criterio de corrección va en un documento aparte, que los alumnos no pueden leer)
  const publicarDesafio = async (d) => {
    const lote = writeBatch(db);
    lote.set(doc(db, 'desafios', fecha), {
      fecha,
      materia: d.materia.trim().slice(0, 40),
      enunciado: d.enunciado.trim().slice(0, 500),
      pista: d.pista.trim().slice(0, 200),
    });
    lote.set(doc(db, 'desafios_docente', fecha), { fecha, respuestaEsperada: d.respuestaEsperada.trim().slice(0, 300) });
    try {
      await lote.commit();
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Docente: tareas extra de hoy (cada ranura x1..x5 conserva su id, así las aprobaciones no se corren)
  const publicarTareasExtra = async (items) => {
    const limpios = items
      .filter((x) => IDS_EXTRA.includes(x.id) && x.titulo.trim())
      .map((x) => ({ id: x.id, titulo: x.titulo.trim().slice(0, 60), momento: x.momento === 'cierre' ? 'cierre' : 'apertura' }));
    try {
      await setDoc(doc(db, 'tareas_extra', fecha), { fecha, items: limpios });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Docente: premio de la semana en curso (el id del documento es el lunes de esa semana)
  const publicarPremio = async (texto) => {
    try {
      await setDoc(doc(db, 'premios', semana), { semana, texto: texto.trim().slice(0, 120) });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Docente: vuelve los puntos a 0; opcionalmente borra también todo el historial de jornadas
  const reiniciarPuntos = async (borrarHistorial) => {
    try {
      const lote = writeBatch(db);
      TURNOS.forEach((t) => lote.set(doc(db, 'turnos', t.id), { puntos: 0 }));
      await lote.commit();
      if (borrarHistorial) {
        const docs = (await getDocs(collection(db, 'jornadas'))).docs;
        for (let i = 0; i < docs.length; i += 400) {
          const b = writeBatch(db);
          docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
          await b.commit();
        }
      }
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  const loginDocente = (email, clave) => signInWithEmailAndPassword(auth, email, clave);
  const logoutDocente = () => signOut(auth);

  const value = {
    alumnos: ALUMNOS, tareas: tareasDelDia, jornada, jefe, jefeSugerido: jefeDelDia(), hechas, aprobadas, plantaOperativa, plantaCerrada, asistencia: actual.asistencia ?? null, extras,
    desafioResuelto: actual.desafioAprobado === true, respuestaEnviada: actual.respuesta ?? null, rechazos: actual.rechazos ?? 0,
    ranking, puntosDesafio: PUNTOS_DESAFIO, puntosChecklist: PUNTOS_CHECKLIST, puntosCierre: PUNTOS_CIERRE,
    iniciarTurno, cerrarTurno, toggleTarea, enviarRespuesta, guardarAsistencia, publicarTareasExtra,
    authListo, esDocente, cuentaSinPermiso: !!user && !user.isAnonymous && !esDocente, error,
    desafioHoy, criterioDocente, publicarDesafio,
    semana, resumenSemana, premioSemana, historial, premios, publicarPremio, reiniciarPuntos,
    jornadasHoy, aprobarTarea, aprobarDesafio, rechazarDesafio, loginDocente, logoutDocente,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlant debe usarse dentro de <PlantProvider>');
  return ctx;
}
