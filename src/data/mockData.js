export const TURNOS = [
  { id: 'alfa', nombre: 'Turno Alfa' },
  { id: 'beta', nombre: 'Turno Beta' },
  { id: 'gamma', nombre: 'Turno Gamma' },
  { id: 'delta', nombre: 'Turno Delta' },
];

export const PUNTAJES_INICIALES = { alfa: 0, beta: 0, gamma: 0, delta: 0 };

// Jefe de Planta de cada día de la semana
export const ALUMNOS = [
  { id: 1, nombre: 'Mascaros, M.', dia: 'Lunes', turno: 'alfa' },
  { id: 2, nombre: 'Ferrio, M.', dia: 'Martes', turno: 'beta' },
  { id: 3, nombre: 'Gonzalez, V.', dia: 'Miércoles', turno: 'gamma' },
  { id: 4, nombre: 'Godoy, U.', dia: 'Jueves', turno: 'delta' },
  { id: 5, nombre: 'Toledo, D.', dia: 'Viernes', turno: 'alfa' },
];



export const TAREAS = [
  { id: 'fichaje', titulo: 'Fichaje Anticipado', detalle: 'Llegar antes del timbre y registrar la entrada', icono: 'Timer' },
  { id: 'ventilacion', titulo: 'Ventilación y Pizarrón', detalle: 'Abrir ventanas y dejar el pizarrón limpio', icono: 'Wind' },
  { id: 'insumos', titulo: 'Insumos listos', detalle: 'Tizas, borrador y materiales sobre el escritorio', icono: 'PackageCheck' },
  { id: 'desafio', titulo: 'Desafío en Pizarrón', detalle: 'Escribir el desafío matemático del día', icono: 'Presentation' },
];

// Uno por día hábil (índice 0 = lunes)
export const DESAFIOS = [
  { enunciado: 'Una máquina produce 48 piezas por hora. ¿Cuántas piezas produce en 7 horas y media?', respuesta: 360, pista: 'Multiplicá 48 por 7,5.' },
  { enunciado: 'Resolvé la ecuación 3x − 7 = 20. ¿Cuánto vale x?', respuesta: 9, pista: 'Sumá 7 a ambos lados y después dividí por 3.' },
  { enunciado: 'Un lote de 250 piezas tiene 8% de piezas defectuosas. ¿Cuántas piezas defectuosas hay?', respuesta: 20, pista: 'Calculá el 8% de 250.' },
  { enunciado: 'Una chapa rectangular mide 12 cm de base y 9 cm de altura. ¿Cuánto mide su diagonal en cm?', respuesta: 15, pista: 'Usá el teorema de Pitágoras.' },
  { enunciado: '¿Cuánto es (−4)² + 3·(−5) + 20 ÷ 4?', respuesta: 6, pista: 'Respetá la jerarquía de operaciones.' },
];

// Desafío que corresponde a una fecha 'AAAA-MM-DD' (fin de semana usa el del lunes)
export function desafioDeFecha(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return DESAFIOS[dow >= 1 && dow <= 5 ? dow - 1 : 0];
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Jefe de Planta que le toca al día indicado (null en fin de semana)
export function jefeDelDia(fecha = new Date()) {
  return ALUMNOS.find((a) => a.dia === DIAS_SEMANA[fecha.getDay()]) ?? null;
}

export function getJornada() {
  const hoy = new Date();
  const dia = hoy.toLocaleDateString('es-AR', { weekday: 'long' });
  const dow = hoy.getDay(); // 0 = domingo
  const indice = dow >= 1 && dow <= 5 ? dow - 1 : 0; // fin de semana usa el desafío del lunes
  return {
    diaNombre: dia.charAt(0).toUpperCase() + dia.slice(1),
    desafio: DESAFIOS[indice],
  };
}
