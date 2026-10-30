import { ALUMNOS } from '../data/mockData';

// Los líderes se pueden cambiar desde el panel docente con una fecha de vigencia ("desde el lunes 2/11 el líder es X").
// Se guardan en Firestore (config/lideres) como una lista de versiones: { desde: 'AAAA-MM-DD', items: [{ id, nombre, dia }] }.
// Para una fecha rige la última versión cuya fecha "desde" sea menor o igual; si no hay ninguna, rige la lista de mockData.js.
// Los ids (1 a 5) y los equipos (e1 a e5) no cambian: lo que cambia es quién es el líder de cada puesto y qué día le toca.

export const DIAS_CLASE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const textoValido = (v) => typeof v === 'string' && v.trim().length > 0;

export function alumnosEn(versiones, fecha) {
  const vigente = [...(versiones ?? [])]
    .filter((v) => typeof v?.desde === 'string' && v.desde <= fecha && Array.isArray(v.items))
    .sort((a, b) => a.desde.localeCompare(b.desde))
    .pop();
  if (!vigente) return ALUMNOS;
  return ALUMNOS.map((base) => {
    const c = vigente.items.find((x) => Number(x?.id) === base.id);
    if (!c || !textoValido(c.nombre) || !DIAS_CLASE.includes(c.dia)) return base;
    return { ...base, nombre: c.nombre.trim(), dia: c.dia };
  });
}

// Devuelve un mensaje de error en español, o '' si la lista está bien
export function validarLideres(items) {
  if (!Array.isArray(items) || items.length !== ALUMNOS.length) return 'Faltan líderes.';
  if (items.some((x) => !textoValido(x.nombre))) return 'Todos los líderes necesitan un nombre.';
  if (items.some((x) => !DIAS_CLASE.includes(x.dia))) return 'Elegí un día de lunes a viernes para cada líder.';
  if (new Set(items.map((x) => x.dia)).size !== items.length) return 'Cada día tiene que tener un solo líder: hay dos con el mismo día.';
  return '';
}

export function limpiarItems(items) {
  return [...items]
    .sort((a, b) => a.id - b.id)
    .map((x) => ({ id: Number(x.id), nombre: String(x.nombre).trim().slice(0, 40), dia: x.dia }));
}

// Agrega o reemplaza la versión de esa fecha y deja la lista ordenada
export function conVersion(versiones, desde, items) {
  return [...(versiones ?? []).filter((v) => v.desde !== desde), { desde, items: limpiarItems(items) }]
    .sort((a, b) => a.desde.localeCompare(b.desde));
}

export const sinVersion = (versiones, desde) => (versiones ?? []).filter((v) => v.desde !== desde);
