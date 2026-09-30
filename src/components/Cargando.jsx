import { Cog, Factory } from 'lucide-react';

export default function Cargando() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4" aria-busy="true">
      <div role="status" className="w-full max-w-sm bg-white border-2 border-acero rounded-lg overflow-hidden shadow-[6px_6px_0_0_#1f2a33]">
        <div className="franja-peligro h-3" />
        <div className="p-8 text-center space-y-5">
          <div className="relative mx-auto size-20 grid place-items-center rounded-full bg-seguridad border-2 border-acero">
            <Factory className="size-10" strokeWidth={2.25} aria-hidden="true" />
            <Cog
              className="anim-giro absolute -right-3 -bottom-3 size-10 p-1.5 rounded-full bg-white border-2 border-acero"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold leading-none">Encendiendo la planta…</h1>
            <p className="mt-2 text-acero/70">Conectando con el servidor</p>
          </div>
          <div className="h-2 rounded-full bg-hormigon overflow-hidden" aria-hidden="true">
            <div className="anim-carga h-full w-1/3 rounded-full bg-seguridad" />
          </div>
        </div>
      </div>
    </main>
  );
}
