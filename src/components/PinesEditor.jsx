import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { equipoDe } from '../data/mockData';
import { btn, campo } from './estilos';
import Avatar from './Avatar';

const pinAlAzar = () => String(Math.floor(Math.random() * 9000) + 1000);

function FilaPin({ lider }) {
  const { pinesDocente, guardarPin, quitarPin } = usePlant();
  const actual = pinesDocente[lider.id] ?? '';
  const [valor, setValor] = useState('');
  const [estado, setEstado] = useState('');

  const guardar = async () => {
    setEstado('guardando');
    const ok = await guardarPin(lider.id, valor);
    setEstado(ok ? 'ok' : '');
    if (ok) setValor('');
  };
  const quitar = async () => {
    if (window.confirm(`¿Quitar el PIN de ${lider.nombre}? Cualquiera podría entrar como ese líder.`)) await quitarPin(lider.id);
  };

  return (
    <li className="grid gap-2 grid-cols-1 sm:grid-cols-[1fr_7rem_auto] items-center border-b border-acero/15 pb-2">
      <div className="flex items-center gap-2 min-w-0">
        <Avatar emoji={lider.avatar} className="size-9 text-xl" />
        <span className="truncate">{lider.dia} · {lider.nombre} · {equipoDe(lider)?.nombre}</span>
      </div>
      <div className="text-sm font-semibold tabular-nums">{actual ? <>PIN: <span className="tracking-widest">{actual}</span></> : <span className="text-acero/60">Sin PIN</span>}</div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={valor} onChange={(e) => { setValor(e.target.value.replace(/\D/g, '').slice(0, 4)); setEstado(''); }}
          inputMode="numeric" maxLength={4} placeholder="4 números" aria-label={`Nuevo PIN de ${lider.nombre}`} className={`${campo} w-28`}
        />
        <button type="button" onClick={() => { setValor(pinAlAzar()); setEstado(''); }} className={btn}>Al azar</button>
        <button type="button" onClick={guardar} disabled={valor.length !== 4 || estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>{actual ? 'Cambiar' : 'Guardar'}</button>
        {actual && <button type="button" onClick={quitar} className="underline text-alarma text-sm">Quitar</button>}
        {estado === 'ok' && <span role="status" className="text-operativa font-semibold text-sm">Guardado ✓</span>}
      </div>
    </li>
  );
}

// PIN por líder: evita que un compañero tome el turno de otro y pise su trabajo antes de que se apruebe
export default function PinesEditor() {
  const { alumnosEn, fecha } = usePlant();
  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">PIN de los líderes</h2>
      <p className="text-sm text-acero/70 mb-3">
        Con PIN, para tomar el mando de ese líder hay que escribir 4 números; sin PIN, todo funciona como siempre. Los PIN los ves solo vos:
        entregáselos a cada líder (y al suplente del día, si hay uno). Si cambiás un PIN, el celular que ya había entrado tiene que escribir el nuevo.
        Los docentes no necesitan PIN.
      </p>
      <ul className="space-y-2">
        {alumnosEn(fecha).map((l) => <FilaPin key={l.id} lider={l} />)}
      </ul>
    </section>
  );
}
