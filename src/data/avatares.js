// Avatares que el docente le puede asignar a cada Jefe de Planta (emojis estándar: no hay imágenes que cargar).
export const AVATARES = [
  { emoji: '🤖', nombre: 'Robot' },
  { emoji: '🦾', nombre: 'Brazo mecánico' },
  { emoji: '⚙️', nombre: 'Engranaje' },
  { emoji: '🔧', nombre: 'Llave' },
  { emoji: '🛠️', nombre: 'Herramientas' },
  { emoji: '🦺', nombre: 'Chaleco' },
  { emoji: '👷', nombre: 'Obrero' },
  { emoji: '🚀', nombre: 'Cohete' },
  { emoji: '⚡', nombre: 'Rayo' },
  { emoji: '🔥', nombre: 'Fuego' },
  { emoji: '🧠', nombre: 'Cerebro' },
  { emoji: '🎯', nombre: 'Diana' },
  { emoji: '🦊', nombre: 'Zorro' },
  { emoji: '🐯', nombre: 'Tigre' },
  { emoji: '🦅', nombre: 'Águila' },
  { emoji: '🐺', nombre: 'Lobo' },
  { emoji: '🐼', nombre: 'Panda' },
  { emoji: '🦁', nombre: 'León' },
  { emoji: '🐙', nombre: 'Pulpo' },
  { emoji: '🦖', nombre: 'Dinosaurio' },
];

export const EMOJIS_AVATAR = AVATARES.map((a) => a.emoji);
export const esAvatar = (v) => EMOJIS_AVATAR.includes(v);
