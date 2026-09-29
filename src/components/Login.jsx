import { useState } from 'react';
import { Factory, HardHat } from 'lucide-react';
import { usePlant } from '../context/PlantContext';

export default function Login() {
  const { alumnos, iniciarTurno } = usePlant();
  const [id, setId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id) iniciarTurno(Number(id));
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-acero rounded-lg overflow-hidden shadow-[6px_6px_0_0_#1f2a33]">
        <div className="franja-peligro h-3" />
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Factory className="size-10 text-seguridad shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <h1 className="font-display text-4xl font-bold leading-none">Operación: Jefe de Planta</h1>
          </div>

          <div className="space-y-2">
            <label htmlFor="alumno" className="block font-medium">
              ¿Quién es el Jefe de Planta hoy?
            </label>
            <select
              id="alumno"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full border-2 border-acero rounded-md px-3 py-2.5 bg-white focus:outline-none focus:ring-4 focus:ring-seguridad/60"
            >
              <option value="">Elegí tu nombre</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>{a.dia} · {a.nombre}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!id}
            className="w-full flex items-center justify-center gap-2 bg-seguridad text-acero font-display text-2xl font-bold py-2.5 rounded-md border-2 border-acero transition enabled:hover:bg-acero enabled:hover:text-seguridad disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-seguridad/60"
          >
            <HardHat className="size-6" aria-hidden="true" />
            Tomar el mando
          </button>
        </form>
      </div>
    </main>
  );
}
