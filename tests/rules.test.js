// Pruebas de firestore.rules contra el emulador. Se corren con `npm run test:rules` (necesita Firebase CLI y Java).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';

let env;

// Fecha de Argentina (UTC-3) 'AAAA-MM-DD', igual que calculan las reglas
const diaAR = (offset = 0) => new Date(Date.now() - 3 * 3600e3 + offset * 864e5).toISOString().slice(0, 10);
const HOY = diaAR(0);
const VIEJO = diaAR(-10);

const alumno = () => env.authenticatedContext('alumno', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const docente = () => env.authenticatedContext('docente', { firebase: { sign_in_provider: 'password' } }).firestore();
const docenteEF = () => env.authenticatedContext('ef', { firebase: { sign_in_provider: 'password' } }).firestore();
const superadmin = () => env.authenticatedContext('super', { firebase: { sign_in_provider: 'password' } }).firestore();

const sembrar = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-jefe-de-planta',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
afterAll(() => env.cleanup());
beforeEach(async () => {
  await env.clearFirestore();
  await sembrar(async (db) => {
    await setDoc(doc(db, 'docentes', 'docente'), { activo: true });
    await setDoc(doc(db, 'docentes', 'ef'), { rol: 'edfisica' });
    await setDoc(doc(db, 'docentes', 'super'), { rol: 'superadmin' });
    await setDoc(doc(db, 'turnos', 'e1'), { puntos: 20 });
    await setDoc(doc(db, 'jornadas', `${VIEJO}_1`), { fecha: VIEJO, jefeId: 1, declaradas: { fichaje: true } });
    await setDoc(doc(db, 'jornadas', `${HOY}_2`), { fecha: HOY, jefeId: 2, declaradas: { fichaje: true } });
  });
});

describe('alumnos (sesión anónima)', () => {
  it('crean la jornada de hoy', async () => {
    await assertSucceeds(setDoc(doc(alumno(), 'jornadas', `${HOY}_1`), { fecha: HOY, jefeId: 1, declaradas: { fichaje: true } }));
  });

  it('toleran un día de diferencia (ayer y mañana)', async () => {
    for (const o of [-1, 1]) {
      const f = diaAR(o);
      await assertSucceeds(setDoc(doc(alumno(), 'jornadas', `${f}_3`), { fecha: f, jefeId: 3 }));
    }
  });

  it('no pueden crear jornadas de fechas lejanas', async () => {
    await assertFails(setDoc(doc(alumno(), 'jornadas', `${VIEJO}_3`), { fecha: VIEJO, jefeId: 3 }));
    const lejos = diaAR(30);
    await assertFails(setDoc(doc(alumno(), 'jornadas', `${lejos}_3`), { fecha: lejos, jefeId: 3 }));
  });

  it('no pueden crear jornadas de un líder que no existe', async () => {
    await assertFails(setDoc(doc(alumno(), 'jornadas', `${HOY}_7`), { fecha: HOY, jefeId: 7 }));
  });

  it('marcan tareas en la jornada de hoy', async () => {
    await assertSucceeds(updateDoc(doc(alumno(), 'jornadas', `${HOY}_2`), { 'declaradas.ventilacion': true }));
  });

  it('no pueden modificar jornadas viejas', async () => {
    await assertFails(updateDoc(doc(alumno(), 'jornadas', `${VIEJO}_1`), { 'declaradas.ventilacion': true }));
  });

  it('no pueden aprobar tareas ni sumarse premios', async () => {
    await assertFails(updateDoc(doc(alumno(), 'jornadas', `${HOY}_2`), { aprobadas: { fichaje: true } }));
    await assertFails(updateDoc(doc(alumno(), 'jornadas', `${HOY}_2`), { premioChecklist: true }));
  });

  it('no pueden tocar los puntos ni los bonos', async () => {
    await assertFails(updateDoc(doc(alumno(), 'turnos', 'e1'), { puntos: 999 }));
    await assertFails(setDoc(doc(alumno(), 'bonos', 'x'), { turnoId: 'e1', puntos: 10, motivo: 'a', fecha: HOY }));
  });

  it('no pueden cambiar la respuesta una vez aprobado el desafío', async () => {
    await sembrar((db) => updateDoc(doc(db, 'jornadas', `${HOY}_2`), { respuesta: '42', desafioAprobado: true }));
    await assertFails(updateDoc(doc(alumno(), 'jornadas', `${HOY}_2`), { respuesta: '43' }));
  });

  it('no leen la respuesta esperada del desafío', async () => {
    await sembrar((db) => setDoc(doc(db, 'desafios_docente', HOY), { respuestaEsperada: '42' }));
    await assertFails(getDoc(doc(alumno(), 'desafios_docente', HOY)));
  });
});

describe('docente', () => {
  it('aprueba una jornada de un día anterior y suma puntos', async () => {
    await assertSucceeds(updateDoc(doc(docente(), 'jornadas', `${VIEJO}_1`), { aprobadas: { fichaje: true }, premioChecklist: true }));
    await assertSucceeds(updateDoc(doc(docente(), 'turnos', 'e1'), { puntos: increment(10) }));
  });

  it('retira un premio y resta los puntos', async () => {
    await assertSucceeds(updateDoc(doc(docente(), 'jornadas', `${VIEJO}_1`), { premioChecklist: false }));
    await assertSucceeds(updateDoc(doc(docente(), 'turnos', 'e1'), { puntos: increment(-10) }));
  });

  it('no borra jornadas (solo el superadmin)', async () => {
    await assertFails(deleteDoc(doc(docente(), 'jornadas', `${VIEJO}_1`)));
  });
});

describe('cuenta de Ed. Física', () => {
  it('suma exactamente 10 puntos', async () => {
    await assertSucceeds(updateDoc(doc(docenteEF(), 'turnos', 'e1'), { puntos: increment(10) }));
  });

  it('no puede sumar otra cantidad ni restar', async () => {
    await assertFails(updateDoc(doc(docenteEF(), 'turnos', 'e1'), { puntos: increment(20) }));
    await assertFails(updateDoc(doc(docenteEF(), 'turnos', 'e1'), { puntos: increment(-10) }));
  });

  it('aprueba tareas de Ed. Física y su premio, pero no otras tareas', async () => {
    await assertSucceeds(updateDoc(doc(docenteEF(), 'jornadas', `${HOY}_2`), { 'aprobadas.ef_salida': true, premioEdFisica: true }));
    await assertFails(updateDoc(doc(docenteEF(), 'jornadas', `${HOY}_2`), { 'aprobadas.fichaje': true }));
    await assertFails(updateDoc(doc(docenteEF(), 'jornadas', `${HOY}_2`), { premioChecklist: true }));
  });

  it('no puede retirar el premio de Ed. Física', async () => {
    await sembrar((db) => updateDoc(doc(db, 'jornadas', `${HOY}_2`), { premioEdFisica: true }));
    await assertFails(updateDoc(doc(docenteEF(), 'jornadas', `${HOY}_2`), { premioEdFisica: false }));
  });
});

describe('config (líderes y días de Ed. Física con fecha de vigencia)', () => {
  const edf = { versiones: [{ desde: '2027-03-01', dias: [1, 3] }] };

  it('el docente guarda los días de Ed. Física y los líderes', async () => {
    await assertSucceeds(setDoc(doc(docente(), 'config', 'edfisica'), edf));
    await assertSucceeds(setDoc(doc(docente(), 'config', 'lideres'), { versiones: [] }));
  });

  it('los alumnos y la cuenta de Ed. Física no los cambian, pero cualquiera con sesión los lee', async () => {
    await sembrar((db) => setDoc(doc(db, 'config', 'edfisica'), edf));
    await assertFails(setDoc(doc(alumno(), 'config', 'edfisica'), edf));
    await assertFails(setDoc(doc(docenteEF(), 'config', 'edfisica'), edf));
    await assertSucceeds(getDoc(doc(alumno(), 'config', 'edfisica')));
  });

  it('el docente no puede crear otros documentos de config ni con otra forma', async () => {
    await assertFails(setDoc(doc(docente(), 'config', 'otro'), edf));
    await assertFails(setDoc(doc(docente(), 'config', 'edfisica'), { versiones: [], extra: 1 }));
    await assertFails(setDoc(doc(docente(), 'config', 'edfisica'), { versiones: 'lunes' }));
  });
});

describe('superadmin', () => {
  it('borra jornadas', async () => {
    await assertSucceeds(deleteDoc(doc(superadmin(), 'jornadas', `${VIEJO}_1`)));
  });
});
