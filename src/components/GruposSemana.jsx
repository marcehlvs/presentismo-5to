import { useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { equipoDe } from '../data/mockData';
import { textoGrupo } from '../lib/grupos';
import { etiquetaSemana } from '../lib/semanas';
import { btn } from './estilos';
import Avatar from './Avatar';

// Sorteo de los grupos de la semana: cada líder recibe compañeros (por número de lista) y todos quedan en un solo grupo
export default function GruposSemana() {
  const { alumnosEn, semana, gruposSemana, sortearGruposSemana } = usePlant();
  const [estado, setEstado] = useState('');
  const lideres = alumnosEn(semana);
  const veces = gruposSemana?.intentos ?? 0;
  const cuando = gruposSemana?.creado?.toDate?.().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

  const sortear = async () => {
    if (veces > 0 && !window.confirm(`Esta semana ya se sorteó ${veces === 1 ? 'una vez' : `${veces} veces`}. ¿Volver a sortear? Todos van a ver que se sorteó de nuevo.`)) return;
    setEstado('sorteando');
    setEstado((await sortearGruposSemana()) ? 'ok' : '');
  };

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Grupos de la semana</h2>
      <p className="text-sm text-acero/70 mb-3">
        Semana del {etiquetaSemana(semana)}. Cada líder recibe compañeros al azar (por número de lista) para que todos se comprometan a venir: los 24 quedan en un solo grupo,
        sin repetir, y se evitan los grupos de las últimas semanas. Todos los alumnos ven los grupos en la tabla de posiciones. Se guardan solo números de lista.
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={sortear} disabled={estado === 'sorteando'} className={`${btn} bg-acero text-seguridad`}>
          {veces > 0 ? 'Volver a sortear' : 'Sortear grupos de esta semana'}
        </button>
        {veces > 0 && <span className="text-sm text-acero/70">Sorteado {cuando ? `el ${cuando}` : ''} · {veces === 1 ? '1 sorteo' : `${veces} sorteos`}</span>}
        {estado === 'ok' && <span role="status" className="text-operativa font-semibold">Sorteado ✓</span>}
      </div>
      {veces === 0 ? (
        <p className="text-sm">Todavía no se sortearon los grupos de esta semana.</p>
      ) : (
        <ul className="space-y-2">
          {lideres.map((l) => (
            <li key={l.id} className="flex items-start gap-2 border-b border-acero/15 pb-2">
              <Avatar emoji={l.avatar} className="size-9 text-xl" />
              <div className="min-w-0">
                <p className="font-semibold">{equipoDe(l)?.nombre} · {l.dia} · {l.nombre}</p>
                <p className="text-sm tabular-nums">{textoGrupo(gruposSemana, l.id) || 'Sin grupo (cambió el líder: volvé a sortear)'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
