import { useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { TOTAL_CURSO, equipoDe } from '../data/mockData';
import { avisosFijos, parsearNumeros, textoGrupo } from '../lib/grupos';
import { etiquetaSemana } from '../lib/semanas';
import { btn, campo } from './estilos';
import { useConfirmar } from './Confirmar';
import Avatar from './Avatar';

// Grupos de la semana: se pueden definir a mano (por ejemplo, grupos ya sorteados en clase) y sortear los que faltan.
// Cada líder tiene su número de lista; los compañeros se escriben por número de lista (no se guardan nombres).
export default function GruposSemana() {
  const { alumnosEn, semana, gruposSemana, guardarGruposSemana } = usePlant();
  const [confirmar, dialogo] = useConfirmar();
  const [textos, setTextos] = useState({});
  const [estado, setEstado] = useState('');
  const lideres = alumnosEn(semana);
  const veces = gruposSemana?.intentos ?? 0;
  const manuales = (gruposSemana?.manuales ?? []).map(String);
  const cuando = gruposSemana?.creado?.toDate?.().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  // Lo que el docente escribió en cada fila ('' = no se toca ese grupo)
  const analisis = useMemo(() => {
    const fijos = {};
    const errores = {};
    for (const l of lideres) {
      const t = textos[l.id];
      if (t == null || t.trim() === '') continue;
      const r = parsearNumeros(t);
      if (r.error) errores[l.id] = r.error; else fijos[String(l.id)] = r.numeros;
    }
    return { fijos, errores, avisos: avisosFijos(lideres, fijos) };
  }, [textos, lideres]);
  const hayErrores = Object.keys(analisis.errores).length > 0;
  const hayManuales = Object.keys(analisis.fijos).length > 0;

  const ejecutar = async (modo, confirmacion) => {
    if (confirmacion && !(await confirmar(confirmacion, { aceptar: 'Sí, continuar' }))) return;
    setEstado('guardando');
    const ok = await guardarGruposSemana({ modo, manuales: analisis.fijos });
    setEstado(ok ? 'ok' : '');
    if (ok) setTextos({});
  };
  const cambiar = (id, v) => { setTextos((p) => ({ ...p, [id]: v })); setEstado(''); };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Grupos de la semana</h2>
      <p className="text-sm text-acero/70 mb-3">
        {etiquetaSemana(semana)} · {TOTAL_CURSO} alumnos. Cada líder tiene su grupo, por número de lista; nadie puede estar en dos. Si un grupo ya se sorteó en clase,
        escribí sus compañeros (sin el líder) y tocá «Guardar lo definido a mano»; después «Sortear los que faltan» reparte al azar a los demás (se evita repetir los grupos de las últimas semanas).
        Todos los alumnos ven los grupos en la tabla de posiciones. Se guardan solo números de lista.
      </p>

      <ul className="space-y-3 mb-3">
        {lideres.map((l) => {
          const tiene = Boolean(textoGrupo(gruposSemana, l.id));
          return (
            <li key={l.id} className="border-b border-acero/15 pb-3">
              <div className="flex items-start gap-2">
                <Avatar emoji={l.avatar} className="size-9 text-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{equipoDe(l)?.nombre} · {l.dia} · {l.nombre} (n.º {l.numero})</p>
                  <p className="text-sm tabular-nums">
                    {tiene ? <>Grupo: {textoGrupo(gruposSemana, l.id)}{manuales.includes(String(l.id)) ? ' · definido a mano' : ' · sorteado'}</> : <span className="text-acero/60">Sin grupo todavía</span>}
                  </p>
                </div>
              </div>
              <label className="mt-2 block sm:max-w-md">
                <span className="sr-only">Compañeros del grupo del {l.dia}, por número de lista</span>
                <input
                  value={textos[l.id] ?? ''} onChange={(e) => cambiar(l.id, e.target.value)} inputMode="numeric" autoComplete="off"
                  placeholder="Definir a mano: compañeros, ej. 10, 5, 1, 4" className={campo}
                />
              </label>
              {analisis.errores[l.id] && <p role="alert" className="mt-1 text-sm font-semibold text-alarma">{analisis.errores[l.id]}</p>}
            </li>
          );
        })}
      </ul>

      {analisis.avisos.map((a) => <p key={a} role="status" className="mb-2 text-sm font-semibold text-alarma">⚠ {a}</p>)}

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => ejecutar('manuales', veces > 0 ? 'Se guardan solo los grupos definidos a mano: los que se habían sorteado antes se descartan y hay que sortear de nuevo los que falten. ¿Seguir?' : '')}
          disabled={!hayManuales || hayErrores || estado === 'guardando'} className={`${btn} bg-acero text-seguridad`}>Guardar lo definido a mano</button>
        <button onClick={() => ejecutar('faltantes', '')} disabled={hayErrores || estado === 'guardando'} className={btn}>Sortear los que faltan</button>
        {veces > 0 && (
          <button onClick={() => ejecutar('todo', `Ya hay grupos esta semana (${veces === 1 ? '1 cambio registrado' : `${veces} cambios registrados`}). ¿Volver a sortear todo, menos lo definido a mano? Todos van a ver que se sorteó de nuevo.`)}
            disabled={hayErrores || estado === 'guardando'} className="underline text-alarma text-sm">Volver a sortear todo</button>
        )}
        {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Guardado ✓</span>}
      </div>
      {veces > 0 && <p className="mt-2 text-sm text-acero/70">Última actualización {cuando ? `el ${cuando}` : ''} · {veces === 1 ? '1 cambio registrado' : `${veces} cambios registrados`}</p>}
      {dialogo}
    </section>
  );
}
