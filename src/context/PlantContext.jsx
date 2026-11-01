import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection, deleteField, doc, getDoc, increment, getDocs, onSnapshot, query, runTransaction, serverTimestamp, setDoc, where, writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { feriadoDe } from '../data/feriados';
import { ALUMNOS, TURNOS, TAREAS, TAREAS_EDFISICA, PUNTAJES_INICIALES, getJornada, jefeDelDia, IDS_EXTRA } from '../data/mockData';
import {
  BONO_MAXIMO, aplicarFeriados, PUNTOS_CHECKLIST, PUNTOS_CIERRE, PUNTOS_DESAFIO, PUNTOS_EDFISICA, TAREA_EXTRA_MAX, crearDiasEdFisica, deIso, hoyISO, lunesDe, resumenTurnos, sumarDias,
} from '../lib/semanas';
import { alumnosEn, conVersion, sinVersion, validarLideres } from '../lib/lideres';
import { premiosTrasAprobacion } from '../lib/premios';

export const PlantContext = createContext(null);

const SESION_KEY = 'jefe-de-planta:sesion';
// true: al recargar la página el dispositivo recuerda quién es el Jefe de hoy. false: siempre se vuelve a elegir.
const RECORDAR_SESION = false;

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
      return 'Firestore rechazó la operación: revisá que las reglas estén publicadas y que la fecha del dispositivo sea correcta.';
    case 'ef-no-quita':
      return 'Ya se sumaron los puntos de Educación Física: para quitar esa aprobación pedile a un docente.';
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

// Devolución del docente sobre una tarea o sobre la respuesta al desafío (clave 'respuesta').
// Rechazar siempre deja registro; aprobar solo si hay comentario (si no, se limpia lo anterior).
function conDevolucion(d, clave, resultado, texto) {
  const dev = { ...(d.devoluciones ?? {}) };
  const t = String(texto ?? '').trim().slice(0, 200);
  if (resultado === 'rechazada' || t) dev[clave] = { resultado, texto: t };
  else delete dev[clave];
  return dev;
}

const docsA = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
const setDeFechas = (dias, campo = 'sinClase') => new Set(dias.filter((d) => d[campo]).map((d) => d.fecha));
const momentoExtra = (m) => (m === 'cierre' || m === 'edfisica' ? m : 'apertura');

// Tareas de una jornada: las fijas, las de Ed. Física (si ese día hay) y las extra que cargó el docente
const armarTareas = (conEdFisica, items = []) => [
  ...TAREAS,
  ...(conEdFisica ? TAREAS_EDFISICA : []),
  ...items
    .map((x) => ({
      id: x.id, momento: momentoExtra(x.momento),
      titulo: x.titulo, detalle: 'Tarea agregada por el docente', icono: 'ClipboardList',
    }))
    .filter((t) => t.momento !== 'edfisica' || conEdFisica),
];

export function PlantProvider({ children }) {
  const [fecha, setFecha] = useState(hoyISO);
  const [user, setUser] = useState(null);
  const [esDocente, setEsDocente] = useState(false);
  const [esSuperadmin, setEsSuperadmin] = useState(false); // docentes/{uid}.rol = 'superadmin': docente completo + "Volver a cero"
  const [esDocenteEF, setEsDocenteEF] = useState(false); // cuenta docente de Ed. Física: solo aprueba el bloque de Ed. Física
  const [authListo, setAuthListo] = useState(false);
  const [perfilNoCargo, setPerfilNoCargo] = useState(false); // no se pudo leer docentes/{uid} (red): no es lo mismo que "sin permisos"
  const [error, setError] = useState('');
  const [puntajes, setPuntajes] = useState({});
  const [jornadasHoy, setJornadasHoy] = useState([]);
  const [jornadasSemana, setJornadasSemana] = useState([]); // toda la semana en curso
  const [diasSemanaBruto, setDiasSemana] = useState([]); // sin clase / suplentes de la semana en curso
  const [bonosSemana, setBonosSemana] = useState([]);
  const [premioSemana, setPremioSemana] = useState(null); // premio que carga el docente
  const [historial, setHistorial] = useState([]); // solo docente: todas las jornadas
  const [diasTodosBruto, setDiasTodos] = useState([]); // solo docente: todos los días con novedades
  const [bonosTodos, setBonosTodos] = useState([]); // solo docente: todos los bonos
  const [premios, setPremios] = useState([]); // solo docente: todos los premios semanales
  const [versionesLideres, setVersionesLideres] = useState([]); // cambios de líderes cargados por el docente (con fecha de vigencia)
  const [extras, setExtras] = useState([]); // tareas extra que agrega el docente para hoy
  const [extrasTodos, setExtrasTodos] = useState({}); // solo docente: tareas extra de todas las fechas (para aprobar días anteriores)
  const [desafioHoy, setDesafioHoy] = useState(null); // lo publica el docente
  const [criterioDocente, setCriterioDocente] = useState(''); // respuesta esperada: solo lo lee el docente
  const [jefeId, setJefeId] = useState(() => leerSesion(fecha));

  // Si la pestaña queda abierta de un día para otro (por ejemplo, la pantalla del aula), pasa sola al día nuevo
  useEffect(() => {
    const t = setInterval(() => setFecha(hoyISO()), 30000);
    return () => clearInterval(t);
  }, []);

  // Sesión: anónima para los alumnos; con email para el docente (debe figurar en /docentes/{uid})
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (!u) {
          setUser(null);
          setEsDocente(false);
          setEsDocenteEF(false);
          setEsSuperadmin(false);
          setPerfilNoCargo(false);
          try { await signInAnonymously(auth); } catch (e) { setError(mensajeError(e)); setAuthListo(true); }
          return;
        }
        let docente = false;
        let soloEF = false;
        let sup = false;
        let noCargo = false;
        if (!u.isAnonymous) {
          try {
            const s = await getDoc(doc(db, 'docentes', u.uid));
            // docentes/{uid} con rol = 'edfisica': solo gestiona Ed. Física; sin ese campo, docente completo
            soloEF = s.exists() && s.data().rol === 'edfisica';
            docente = s.exists() && !soloEF;
            sup = docente && s.data().rol === 'superadmin';
          } catch (e) {
            // Solo un rechazo de las reglas significa "esta cuenta no es docente"; si fue la red, se avisa aparte
            docente = false; soloEF = false; sup = false;
            noCargo = e?.code !== 'permission-denied';
            if (noCargo) console.error('[Firebase] no se pudo leer docentes/{uid}', e);
          }
        }
        setPerfilNoCargo(noCargo);
        setEsDocente(docente);
        setEsDocenteEF(soloEF);
        setEsSuperadmin(sup);
        setUser(u);
        setAuthListo(true);
      }),
    []
  );

  // Tiempo real: puntajes de los turnos, jornadas de hoy y de la semana, días con novedades y bonos
  useEffect(() => {
    if (!user) return undefined;
    const fallo = (e) => setError(mensajeError(e));
    const lunes = lunesDe(fecha);
    const domingo = sumarDias(lunes, 6);
    const semana = (col) => query(collection(db, col), where('fecha', '>=', lunes), where('fecha', '<=', domingo));
    const solo = (activo, fn) => (activo ? fn() : () => {});
    const offs = [
      onSnapshot(collection(db, 'turnos'), (s) => {
        const p = {};
        s.forEach((d) => { p[d.id] = d.data().puntos; });
        setPuntajes(p);
        setError('');
      }, fallo),
      onSnapshot(query(collection(db, 'jornadas'), where('fecha', '==', fecha)), (s) => setJornadasHoy(docsA(s)), fallo),
      onSnapshot(doc(db, 'desafios', fecha), (s) => setDesafioHoy(s.exists() ? s.data() : null), fallo),
      solo(esDocente, () => onSnapshot(doc(db, 'desafios_docente', fecha), (s) => setCriterioDocente(s.exists() ? s.data().respuestaEsperada ?? '' : ''), fallo)),
      onSnapshot(doc(db, 'tareas_extra', fecha), (s) => setExtras(s.exists() ? s.data().items ?? [] : []), fallo),
      onSnapshot(semana('jornadas'), (s) => setJornadasSemana(docsA(s)), fallo),
      onSnapshot(semana('dias'), (s) => setDiasSemana(docsA(s)), fallo),
      onSnapshot(semana('bonos'), (s) => setBonosSemana(docsA(s)), fallo),
      onSnapshot(doc(db, 'premios', lunes), (s) => setPremioSemana(s.exists() ? s.data() : null), fallo),
      onSnapshot(doc(db, 'config', 'lideres'), (s) => setVersionesLideres(s.exists() ? s.data().versiones ?? [] : []), fallo),
      solo(esDocente, () => onSnapshot(collection(db, 'jornadas'), (s) => setHistorial(docsA(s)), fallo)),
      solo(esDocente, () => onSnapshot(collection(db, 'dias'), (s) => setDiasTodos(docsA(s)), fallo)),
      solo(esDocente, () => onSnapshot(collection(db, 'bonos'), (s) => setBonosTodos(docsA(s)), fallo)),
      solo(esDocente, () => onSnapshot(collection(db, 'premios'), (s) => setPremios(docsA(s)), fallo)),
      solo(esDocente, () => onSnapshot(collection(db, 'tareas_extra'), (s) => setExtrasTodos(Object.fromEntries(s.docs.map((d) => [d.id, d.data().items ?? []]))), fallo)),
    ];
    return () => offs.forEach((off) => off());
  }, [user, fecha, esDocente]);

  const jornada = useMemo(getJornada, [fecha]);
  const semana = lunesDe(fecha);
  // Días con novedades + feriados nacionales (sin clase salvo que el docente diga "hay clase")
  const diasSemana = useMemo(() => aplicarFeriados(diasSemanaBruto, { desde: semana, hasta: sumarDias(semana, 6) }), [diasSemanaBruto, semana]);
  const diasTodos = useMemo(() => aplicarFeriados(diasTodosBruto), [diasTodosBruto]);
  const sinClaseSemana = useMemo(() => setDeFechas(diasSemana), [diasSemana]);
  const sinClaseTodos = useMemo(() => setDeFechas(diasTodos), [diasTodos]);
  const edFisicaSemana = useMemo(() => crearDiasEdFisica(diasSemana), [diasSemana]);
  const edFisicaTodos = useMemo(() => crearDiasEdFisica(diasTodos), [diasTodos]);
  const resumenSemana = useMemo(
    () => resumenTurnos(jornadasSemana, { bonos: bonosSemana, diasSinClase: sinClaseSemana, diasEdFisica: edFisicaSemana }),
    [jornadasSemana, bonosSemana, sinClaseSemana, edFisicaSemana]
  );
  const diaHoy = diasSemana.find((d) => d.fecha === fecha) ?? null;
  const hoySinClase = !!diaHoy?.sinClase;
  // Ed. Física: lunes y viernes (salvo que el docente la haya quitado ese día) y los días que marcó a mano; solo si hay clase
  const hoyEdFisica = edFisicaSemana.has(fecha) && !hoySinClase;
  const suplentesHoy = diaHoy?.suplentes ?? {};
  // Líderes vigentes hoy, y una función para ver los de otra fecha (por ejemplo, al mirar el historial)
  const alumnos = useMemo(() => alumnosEn(versionesLideres, fecha), [versionesLideres, fecha]);
  const alumnosDe = useMemo(() => (f) => alumnosEn(versionesLideres, f), [versionesLideres]);
  const jefe = alumnos.find((a) => a.id === jefeId) ?? null;
  const actual = jornadasHoy.find((j) => j.jefeId === jefeId) ?? {};
  const hechas = actual.declaradas ?? {};
  const aprobadas = actual.aprobadas ?? {};
  const tareasDelDia = useMemo(() => armarTareas(hoyEdFisica, extras), [extras, hoyEdFisica]);
  const completo = (momento, ap) => tareasDelDia.filter((t) => t.momento === momento).every((t) => ap[t.id]);
  // Para aprobar también jornadas de días anteriores: los docentes tienen cargadas todas las fechas; las demás cuentas, la semana en curso
  const sinClaseDe = (f) => (esDocente ? sinClaseTodos : sinClaseSemana).has(f);
  const edFisicaDe = (f) => (esDocente ? edFisicaTodos : edFisicaSemana).has(f) && !sinClaseDe(f);
  const tareasEn = (f) => (f === fecha ? tareasDelDia : armarTareas(edFisicaDe(f), extrasTodos[f] ?? []));
  const plantaOperativa = completo('apertura', aprobadas);
  const plantaCerrada = completo('cierre', aprobadas);
  const plantaEdFisica = hoyEdFisica && completo('edfisica', aprobadas);

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

  // ---- Docente: aprueba y recién ahí se suman los puntos (una vez por bloque y por jornada). Si esa fecha es día sin clase, no se suma nada.
  // Funciona con la jornada de cualquier fecha (la bandeja de pendientes aprueba días anteriores). Quitar la aprobación de una tarea
  // de un bloque ya premiado retira ese premio y resta sus puntos al equipo. ----
  const aprobarTarea = (j, tareaId, valor, comentario = '') => {
    if (sinClaseDe(j.fecha)) return Promise.resolve();
    const lista = tareasEn(j.fecha);
    const momentoTarea = lista.find((t) => t.id === tareaId)?.momento;
    const edFisicaVigente = edFisicaDe(j.fecha);
    return runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      const nuevas = { ...(d.aprobadas ?? {}), [tareaId]: valor };
      const { cambios: premios, puntos } = premiosTrasAprobacion({
        previo: d, valor, momentoTarea, edFisicaVigente, soloEdFisica: esDocenteEF,
        completo: (m) => lista.filter((t) => t.momento === m).every((t) => nuevas[t.id]),
      });
      // Las reglas solo dejan a la cuenta de Ed. Física sumar 10 puntos, nunca restar
      if (esDocenteEF && puntos < 0) throw Object.assign(new Error('Ed. Física no puede restar puntos'), { code: 'ef-no-quita' });
      if (puntos) sumar(tx, await leerTurno(tx, turnoDe(d.jefeId)), puntos);
      tx.update(ref, {
        aprobadas: nuevas, devoluciones: conDevolucion(d, tareaId, 'aprobada', valor ? comentario : ''), ...premios,
      });
    }).catch((e) => setError(mensajeError(e)));
  };

  // Rechazar una tarea la devuelve al equipo como "sin marcar", con el comentario del docente
  const rechazarTarea = (j, tareaId, comentario = '') => {
    if (sinClaseDe(j.fecha)) return Promise.resolve();
    return runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      tx.update(ref, {
        declaradas: { ...(d.declaradas ?? {}), [tareaId]: false },
        aprobadas: { ...(d.aprobadas ?? {}), [tareaId]: false },
        devoluciones: conDevolucion(d, tareaId, 'rechazada', comentario),
      });
    }).catch((e) => setError(mensajeError(e)));
  };

  const aprobarDesafio = (j, comentario = '') => {
    if (sinClaseDe(j.fecha)) return Promise.resolve();
    return runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      if (d.desafioAprobado) return;
      const t = await leerTurno(tx, turnoDe(d.jefeId));
      sumar(tx, t, PUNTOS_DESAFIO);
      tx.update(ref, { desafioAprobado: true, devoluciones: conDevolucion(d, 'respuesta', 'aprobada', comentario) });
    }).catch((e) => setError(mensajeError(e)));
  };

  const rechazarDesafio = (j, comentario = '') => {
    if (sinClaseDe(j.fecha)) return Promise.resolve();
    return runTransaction(db, async (tx) => {
      const ref = doc(db, 'jornadas', j.id);
      const d = (await tx.get(ref)).data();
      tx.update(ref, {
        respuesta: deleteField(), rechazos: increment(1), devoluciones: conDevolucion(d, 'respuesta', 'rechazada', comentario),
      });
    }).catch((e) => setError(mensajeError(e)));
  };

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
      .map((x) => ({ id: x.id, titulo: x.titulo.trim().slice(0, TAREA_EXTRA_MAX), momento: momentoExtra(x.momento) }));
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

  // Docente: novedades de un día (sin clase / suplente del líder). `mutar` recibe el documento actual y devuelve el nuevo;
  // si no queda ninguna novedad, el documento se borra.
  const editarDia = async (fechaSel, mutar) => {
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'dias', fechaSel);
        const previo = (await tx.get(ref)).data() ?? {};
        const nuevo = mutar({ ...previo, suplentes: { ...(previo.suplentes ?? {}) } });
        if (!nuevo.sinClase && !nuevo.conClase && !nuevo.edFisica && !nuevo.sinEdFisica && Object.keys(nuevo.suplentes).length === 0) tx.delete(ref);
        else tx.set(ref, { ...nuevo, fecha: fechaSel });
      });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Un nombre vacío quita al suplente. Los puntos siguen yendo al equipo del líder (la jornada es del líder).
  const designarSuplente = (fechaSel, liderId, nombre) =>
    editarDia(fechaSel, (d) => {
      const n = String(nombre).trim().slice(0, 40);
      if (n) d.suplentes[String(liderId)] = n;
      else delete d.suplentes[String(liderId)];
      return d;
    });

  const marcarSinClase = (fechaSel, activo, motivo = '') =>
    editarDia(fechaSel, (d) => {
      if (activo) { d.sinClase = true; d.motivo = String(motivo).trim().slice(0, 60); delete d.conClase; }
      else {
        delete d.sinClase; delete d.motivo;
        // En un feriado precargado, "quitar la marca" guarda que ese día sí hay clase (si no, el feriado volvería a aplicarse)
        if (feriadoDe(fechaSel)) d.conClase = true;
      }
      return d;
    });

  // Docente: marca (o desmarca) que ese día hay Ed. Física. Los lunes y viernes ya la tienen: quitarla guarda `sinEdFisica`
  // para esa fecha sola; volver a ponerla borra esa marca. En cualquier otro día se guarda `edFisica`.
  const marcarEdFisica = (fechaSel, activo) =>
    editarDia(fechaSel, (d) => {
      const auto = crearDiasEdFisica([]).has(fechaSel);
      if (activo) {
        delete d.sinEdFisica;
        if (!auto) d.edFisica = true;
      } else {
        delete d.edFisica;
        if (auto) d.sinEdFisica = true;
      }
      return d;
    });

  // Docente: marca Ed. Física en todos los [día de la semana] entre dos fechas (diaSemana: 0 = domingo … 6 = sábado).
  // Cada fecha queda cargada por separado, así se puede quitar una sola (por lluvia, feriado o profe ausente) sin tocar las demás.
  const programarEdFisica = async (diaSemana, desde, hasta) => {
    const fechas = [];
    for (let f = desde; f <= hasta && fechas.length < 120; f = sumarDias(f, 1)) {
      if (deIso(f).getDay() === Number(diaSemana)) fechas.push(f);
    }
    if (fechas.length === 0) return 0;
    try {
      for (let i = 0; i < fechas.length; i += 400) {
        const lote = writeBatch(db);
        fechas.slice(i, i + 400).forEach((f) => lote.set(doc(db, 'dias', f), { fecha: f, edFisica: true }, { merge: true }));
        await lote.commit();
      }
      setError('');
      return fechas.length;
    } catch (e) {
      setError(mensajeError(e));
      return 0;
    }
  };

  // Docente: cambia quién es el líder de cada día a partir de una fecha. Lo anterior no se toca: el historial conserva los nombres de entonces.
  const guardarLideres = async (desde, items) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || validarLideres(items)) return false;
    try {
      await setDoc(doc(db, 'config', 'lideres'), { versiones: conVersion(versionesLideres, desde, items) });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  const quitarVersionLideres = async (desde) => {
    try {
      await setDoc(doc(db, 'config', 'lideres'), { versiones: sinVersion(versionesLideres, desde) });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Docente: bono de puntos extra para un equipo. Se guarda el bono y se suman los puntos en la misma transacción.
  const cargarBono = async ({ turnoId, puntos, motivo, fecha: fechaBono }) => {
    const pts = Math.trunc(Number(puntos));
    const texto = String(motivo ?? '').trim().slice(0, 80);
    if (!TURNOS.some((t) => t.id === turnoId) || !(pts >= 1 && pts <= BONO_MAXIMO) || !texto || !fechaBono) return false;
    try {
      await runTransaction(db, async (tx) => {
        const t = await leerTurno(tx, turnoId);
        tx.set(doc(collection(db, 'bonos')), { turnoId, puntos: pts, motivo: texto, fecha: fechaBono, creado: serverTimestamp() });
        sumar(tx, t, pts);
      });
      setError('');
      return true;
    } catch (e) {
      setError(mensajeError(e));
      return false;
    }
  };

  // Docente: quita un bono (por error de carga) y le resta esos puntos al equipo
  const quitarBono = (b) =>
    runTransaction(db, async (tx) => {
      const ref = doc(db, 'bonos', b.id);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const t = await leerTurno(tx, snap.data().turnoId);
      tx.delete(ref);
      sumar(tx, t, -snap.data().puntos);
    }).catch((e) => setError(mensajeError(e)));

  // Superadmin: vuelve TODO a cero. Puntos de los equipos, jornadas (checklists, asistencia, respuestas), bonos, y el desafío
  // y las tareas extra de hoy. No toca la configuración: líderes, días sin clase / suplentes / Ed. Física, premios de la semana.
  // Primero borra jornadas y bonos y recién al final pone los puntos en cero. Si algo falla a mitad de camino, los puntos todavía no
  // se tocaron y basta con volver a ejecutarlo: repetir el reinicio es seguro.
  const reiniciarPuntos = async () => {
    if (!esSuperadmin) return false;
    try {
      const docs = [
        ...(await getDocs(collection(db, 'jornadas'))).docs,
        ...(await getDocs(collection(db, 'bonos'))).docs,
      ];
      for (let i = 0; i < docs.length; i += 400) {
        const b = writeBatch(db);
        docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
        await b.commit();
      }
      const lote = writeBatch(db);
      TURNOS.forEach((t) => lote.set(doc(db, 'turnos', t.id), { puntos: 0 }));
      lote.delete(doc(db, 'desafios', fecha));
      lote.delete(doc(db, 'desafios_docente', fecha));
      lote.delete(doc(db, 'tareas_extra', fecha));
      await lote.commit();
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
    alumnos, alumnosEn: alumnosDe, versionesLideres, guardarLideres, quitarVersionLideres, tareas: tareasDelDia, jornada, fecha, jefe, jefeSugerido: jefeDelDia(new Date(), alumnos), hechas, aprobadas, plantaOperativa, plantaCerrada, plantaEdFisica, hoyEdFisica, asistencia: actual.asistencia ?? null, extras,
    devoluciones: actual.devoluciones ?? {},
    suplenteHoy: jefe ? suplentesHoy[String(jefe.id)] ?? null : null,
    desafioResuelto: actual.desafioAprobado === true, respuestaEnviada: actual.respuesta ?? null, rechazos: actual.rechazos ?? 0,
    ranking, puntosDesafio: PUNTOS_DESAFIO, puntosChecklist: PUNTOS_CHECKLIST, puntosCierre: PUNTOS_CIERRE, puntosEdFisica: PUNTOS_EDFISICA,
    iniciarTurno, cerrarTurno, toggleTarea, enviarRespuesta, guardarAsistencia, publicarTareasExtra,
    authListo, esDocente, esSuperadmin, esDocenteEF, perfilNoCargo,
    cuentaSinPermiso: !!user && !user.isAnonymous && !esDocente && !esDocenteEF && !perfilNoCargo, error,
    desafioHoy, criterioDocente, publicarDesafio,
    semana, resumenSemana, premioSemana, historial, premios, publicarPremio, reiniciarPuntos,
    diaHoy, hoySinClase, suplentesHoy, jornadasSemana, bonosSemana, diasTodos, bonosTodos, sinClaseTodos, edFisicaTodos,
    sinClaseDe, tareasEn,
    designarSuplente, marcarSinClase, marcarEdFisica, programarEdFisica, cargarBono, quitarBono,
    jornadasHoy, aprobarTarea, rechazarTarea, aprobarDesafio, rechazarDesafio, loginDocente, logoutDocente,
  };

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlant debe usarse dentro de <PlantProvider>');
  return ctx;
}