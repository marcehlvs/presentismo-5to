import { useState } from 'react';
import { Factory, HardHat } from 'lucide-react';
import { usePlant } from '../context/PlantContext';
import { equipoDe } from '../data/mockData';
import AvisoSinClase from './AvisoSinClase';
import Avatar from './Avatar';
import CampoClave from './CampoClave';
import Creditos from './Creditos';
import BotonInstalar from './BotonInstalar';

export default function Login() {
  const { alumnos, iniciarTurno, jefeSugerido, hoySinClase, suplentesHoy, pinesRequeridos } = usePlant();
  const [id, setId] = useState(jefeSugerido ? String(jefeSugerido.id) : '');

  const [pin, setPin] = useState('');
  const [errorPin, setErrorPin] = useState('');
  const [probando, setProbando] = useState(false);
  const pideSuPin = id !== '' && pinesRequeridos.includes(Number(id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id || hoySinClase) return;
    setProbando(true);
    const r = await iniciarTurno(Number(id), pin);
    setProbando(false);
    if (!r.ok) setErrorPin(r.mensaje);
  };
  const suplenteSugerido = jefeSugerido ? suplentesHoy[String(jefeSugerido.id)] : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-acero rounded-lg overflow-hidden shadow-[6px_6px_0_0_#1f2a33]">
        <div className="franja-peligro h-3" />
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Factory className="size-10 text-seguridad shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <h1 className="font-display text-4xl font-bold leading-none">Operación: Jefe de Planta</h1>
          </div>

          <AvisoSinClase />

          <div className="space-y-2">
            <label htmlFor="alumno" className="block font-medium">
              ¿Quién es el Jefe de Planta hoy?
            </label>
            <select
              id="alumno"
              value={id}
              onChange={(e) => { setId(e.target.value); setPin(''); setErrorPin(''); }}
              className="w-full border-2 border-acero rounded-md px-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-seguridad/60"
            >
              <option value="">Elegí tu nombre</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {suplentesHoy[String(a.id)]
                    ? `${a.dia} · ${suplentesHoy[String(a.id)]} (suplente de ${a.nombre}) · ${equipoDe(a)?.nombre}`
                    : `${a.dia} · ${a.nombre} · ${equipoDe(a)?.nombre}`}
                </option>
              ))}
            </select>
            {!hoySinClase && jefeSugerido && (
              <div className="flex items-center gap-3 rounded-md bg-hormigon/60 p-3">
                <Avatar emoji={jefeSugerido.avatar} className="size-12 text-3xl" />
                <p className="text-sm text-acero/70">
                  {suplenteSugerido
                    ? `Hoy ${jefeSugerido.nombre} no está: lo reemplaza ${suplenteSugerido}. Los puntos van al ${equipoDe(jefeSugerido)?.nombre}.`
                    : `Hoy le toca a ${jefeSugerido.nombre}.`}
                </p>
              </div>
            )}
          </div>

          {pideSuPin && (
            <div className="space-y-2">
              <label htmlFor="pin" className="block font-medium">PIN del líder (4 números)</label>
              <CampoClave
                id="pin" value={pin} inputMode="numeric" autoComplete="off" maxLength={4}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErrorPin(''); }}
                className="w-full border-2 border-acero rounded-md px-3 py-2.5 bg-white tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-seguridad/60"
              />
              <p className="text-sm text-acero/70">Si sos suplente, pedile el PIN al docente.</p>
            </div>
          )}
          {errorPin && <p role="alert" className="text-sm font-semibold text-alarma">{errorPin}</p>}

          <button
            type="submit"
            disabled={!id || hoySinClase || probando || (pideSuPin && pin.length !== 4)}
            className="w-full flex items-center justify-center gap-2 bg-seguridad text-acero font-display text-2xl font-bold py-2.5 rounded-md border-2 border-acero transition enabled:hover:bg-acero enabled:hover:text-seguridad disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60"
          >
            <HardHat className="size-6" aria-hidden="true" />
            Tomar el mando
          </button>
          <a href="/pantalla" className="block text-center text-sm underline text-acero/70 hover:text-acero">Abrir modo pantalla</a>
          <BotonInstalar />
          <Creditos />
        </form>
      </div>
    </main>
  );
}
