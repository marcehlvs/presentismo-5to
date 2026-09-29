import { useState } from 'react';
import { usePlant } from '../context/PlantContext';

export default function AccesoDocente() {
  const { loginDocente } = usePlant();
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await loginDocente(email.trim(), clave);
    } catch {
      setError('Email o contraseña incorrectos.');
      setCargando(false);
    }
  };

  const campo = 'w-full border-2 border-acero rounded-md px-3 py-2 focus:outline-none focus:ring-4 focus:ring-seguridad/60';

  return (
    <div className="fixed bottom-4 inset-x-0 flex justify-center px-4">
      {!abierto ? (
        <button onClick={() => setAbierto(true)} className="text-sm underline text-acero/70 hover:text-acero">
          Acceso docente
        </button>
      ) : (
        <form onSubmit={entrar} className="w-full max-w-sm bg-white border-2 border-acero rounded-lg p-4 space-y-3 shadow-[6px_6px_0_0_var(--color-acero)]">
          <p className="font-display text-2xl font-bold">Acceso docente</p>
          <input type="email" required autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
          <input type="password" required autoComplete="current-password" placeholder="Contraseña" value={clave} onChange={(e) => setClave(e.target.value)} className={campo} />
          {error && <p role="alert" className="text-alarma font-semibold text-sm">{error}</p>}
          <div className="flex gap-2">
            <button disabled={cargando} className="flex-1 bg-acero text-seguridad font-display text-xl font-bold py-2 rounded-md disabled:opacity-50">
              {cargando ? 'Entrando…' : 'Entrar'}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="px-3 rounded-md border-2 border-acero">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
