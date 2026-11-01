// Avatar del Jefe de Planta (un emoji dentro de un círculo). Es decorativo: el nombre siempre está escrito al lado.
export default function Avatar({ emoji, className = 'size-12 text-3xl' }) {
  if (!emoji) return null;
  return (
    <span aria-hidden="true" className={`${className} rounded-full bg-seguridad flex items-center justify-center shrink-0 leading-none`}>
      {emoji}
    </span>
  );
}
