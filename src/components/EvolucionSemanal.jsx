import { useMemo, useState } from 'react';
import { usePlant } from '../context/PlantContext';
import { TURNOS } from '../data/mockData';
import { CRITERIO_GANADOR, etiquetaCorta, resumenPorSemana } from '../lib/semanas';

// Color + trazo + forma distintos por equipo, así el gráfico se lee también sin distinguir colores
const ESTILOS = [
  { color: '#1f2a33', dash: '' },
  { color: '#2b6cb0', dash: '8 5' },
  { color: '#2f9e5b', dash: '2 4' },
  { color: '#d64545', dash: '10 4 2 4' },
  { color: '#b8860b', dash: '14 6' },
];

const METRICAS = [
  { id: 'promedio', etiqueta: 'Promedio por jornada', valor: (t) => (t.jornadas || t.puntos ? t.promedio : null), decimales: 1 },
  { id: 'semana', etiqueta: 'Puntos de la semana', valor: (t) => t.puntos, decimales: 0 },
  { id: 'acumulado', etiqueta: 'Acumulado', valor: null, decimales: 0 },
];

// Escala con marcas "redondas" (1, 2, 5, 10…) para el eje vertical
function escala(max) {
  if (max <= 0) return { max: 10, paso: 5 };
  const bruto = max / 4;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / pot;
  const paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pot;
  return { max: Math.ceil(max / paso) * paso, paso };
}

const W = 720;
const H = 320;
const M = { l: 48, r: 20, t: 16, b: 44 };

export default function EvolucionSemanal() {
  const { historial, bonosTodos, sinClaseTodos } = usePlant();
  const [metricaId, setMetricaId] = useState(CRITERIO_GANADOR === 'total' ? 'semana' : 'promedio');
  const metrica = METRICAS.find((m) => m.id === metricaId);

  const semanas = useMemo(() => resumenPorSemana(historial, bonosTodos, sinClaseTodos), [historial, bonosTodos, sinClaseTodos]);

  // valores[equipo] = un número (o null) por semana
  const valores = useMemo(() => {
    const acumulado = Object.fromEntries(TURNOS.map((t) => [t.id, 0]));
    const v = Object.fromEntries(TURNOS.map((t) => [t.id, []]));
    for (const s of semanas) {
      for (const t of s.lista) {
        acumulado[t.id] += t.puntos;
        v[t.id].push(metrica.valor ? metrica.valor(t) : acumulado[t.id]);
      }
    }
    return v;
  }, [semanas, metrica]);

  const n = semanas.length;
  const iw = W - M.l - M.r;
  const ih = H - M.t - M.b;
  const maxValor = Math.max(0, ...Object.values(valores).flat().filter((x) => x != null));
  const { max, paso } = escala(maxValor);
  const x = (i) => (n === 1 ? M.l + iw / 2 : M.l + (i / (n - 1)) * iw);
  const y = (v) => M.t + ih - (v / max) * ih;
  const marcas = Array.from({ length: Math.round(max / paso) + 1 }, (_, i) => i * paso);
  const cadaCuantas = Math.ceil(n / 10);
  const fmt = (v) => v.toFixed(metrica.decimales);

  return (
    <section className="bg-white border-2 border-acero rounded-lg p-5">
      <h2 className="font-display text-3xl font-bold mb-1">Evolución semanal</h2>
      <p className="text-sm text-acero/70 mb-3">Cómo viene cada equipo, semana a semana. Los días sin clase no cuentan y los bonos suman.</p>

      <div role="group" aria-label="Qué mostrar en el gráfico" className="flex flex-wrap gap-2 mb-4">
        {METRICAS.map((m) => (
          <button
            key={m.id} onClick={() => setMetricaId(m.id)} aria-pressed={metricaId === m.id}
            className={`px-3 py-1.5 rounded-md border-2 border-acero font-semibold text-sm ${metricaId === m.id ? 'bg-acero text-seguridad' : ''}`}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

      {n === 0 ? (
        <p>Todavía no hay semanas registradas.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="evo-titulo evo-desc" className="w-full h-auto">
            <title id="evo-titulo">{`Evolución semanal por equipo: ${metrica.etiqueta}`}</title>
            <desc id="evo-desc">Un valor por equipo y por semana. El detalle numérico está en el historial semanal.</desc>
            {marcas.map((m) => (
              <g key={m}>
                <line x1={M.l} x2={W - M.r} y1={y(m)} y2={y(m)} stroke="#1f2a33" strokeOpacity={m === 0 ? 0.6 : 0.12} />
                <text x={M.l - 8} y={y(m) + 4} textAnchor="end" fontSize="12" fill="#1f2a33">{m}</text>
              </g>
            ))}
            {semanas.map((s, i) => (i % cadaCuantas === 0 || i === n - 1) && (
              <text key={s.lunes} x={x(i)} y={H - 20} textAnchor="middle" fontSize="12" fill="#1f2a33">{etiquetaCorta(s.lunes)}</text>
            ))}
            <text x={M.l + iw / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="#1f2a33" fillOpacity="0.7">Lunes de cada semana</text>
            {TURNOS.map((t, k) => {
              const est = ESTILOS[k % ESTILOS.length];
              const pts = valores[t.id].map((v, i) => (v == null ? null : { x: x(i), y: y(v), v, i }));
              const trazo = pts.reduce((d, p, i) => (p ? `${d}${pts[i - 1] ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}` : d), '');
              return (
                <g key={t.id}>
                  <path d={trazo} fill="none" stroke={est.color} strokeWidth="3" strokeDasharray={est.dash} strokeLinejoin="round" />
                  {pts.filter(Boolean).map((p) => (
                    <circle key={p.i} cx={p.x} cy={p.y} r="4.5" fill="#fff" stroke={est.color} strokeWidth="2.5">
                      <title>{`${t.nombre} · Semana del ${etiquetaCorta(semanas[p.i].lunes)}: ${fmt(p.v)}`}</title>
                    </circle>
                  ))}
                </g>
              );
            })}
          </svg>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {TURNOS.map((t, k) => {
              const est = ESTILOS[k % ESTILOS.length];
              const ultimo = [...valores[t.id]].reverse().find((v) => v != null);
              return (
                <li key={t.id} className="flex items-center gap-2">
                  <svg width="34" height="10" aria-hidden="true">
                    <line x1="0" x2="34" y1="5" y2="5" stroke={est.color} strokeWidth="3" strokeDasharray={est.dash} />
                  </svg>
                  <span className="font-semibold">{t.nombre}</span>
                  <span className="tabular-nums text-acero/70">{ultimo == null ? '–' : fmt(ultimo)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
