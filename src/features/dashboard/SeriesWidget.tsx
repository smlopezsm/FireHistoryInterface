import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Loader2, AlertCircle } from 'lucide-react';
import { useSerie, type Capa, type Granularidad, type PedidoZona, type PeriodoParams, type Punto } from '../../api';

interface SeriesWidgetProps {
  zonaNombre: string;
  capa: Capa;
  pedido: PedidoZona | null;
  periodo?: Omit<PeriodoParams, 'capa'>;
  /** Límites de datos (/metadata), para detectar años incompletos. */
  fechaMin?: string;
  fechaMax?: string;
  className?: string;
}

const PAD = { top: 14, right: 16, bottom: 26, left: 48 };
const FONT = 12;

const valorDeCapa = (p: Punto, capa: Capa): number | null =>
  capa === 'modis' ? p.modis : capa === 'viirs' ? p.viirs : p.armonizado;

const COLOR_CAPA: Record<Capa, string> = { armonizado: '#B8EE68', modis: '#68D9D0', viirs: '#FF9C55' };

/** Ancho real del contenedor: el SVG se dibuja en píxeles de pantalla (texto siempre legible). */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setAncho(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

/**
 * Un punto es incompleto si no cubre su período entero: el mes en curso
 * (`parcial` de la API) o, en la serie anual, un año del que solo hay
 * algunos meses (p. ej. 2000 empieza en noviembre).
 */
function esIncompleto(p: Punto, granularidad: Granularidad, mesDesde?: string, mesHasta?: string) {
  if (p.parcial) return true;
  if (granularidad !== 'anio') return false;
  return Boolean((mesDesde && mesDesde > `${p.periodo}-01`) || (mesHasta && mesHasta < `${p.periodo}-12`));
}

/** Gráfico de líneas liviano en SVG (sin dependencias). null corta la línea. */
export const SeriesWidget: React.FC<SeriesWidgetProps> = ({
  zonaNombre,
  capa,
  pedido,
  periodo = {},
  fechaMin,
  fechaMax,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));
  const locale = isEn ? 'en-US' : 'es-AR';
  const sinDato = isEn ? 'no data' : 'sin dato';
  const [granularidad, setGranularidad] = useState<Granularidad>('anio');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [contRef, W] = useAncho<HTMLDivElement>();
  const H = W < 640 ? 200 : 260;

  const { data, isLoading, isFetching, isPlaceholderData, error } = useSerie(pedido, { ...periodo, capa, granularidad });
  // Curva de la consulta anterior (solo si cambió la granularidad): se ve atenuada.
  const desactualizado = isPlaceholderData;
  const puntos = useMemo(() => data?.puntos ?? [], [data]);
  const color = COLOR_CAPA[capa];

  // Período efectivo: el pedido por el usuario recortado a los datos disponibles
  const minMes = fechaMin?.slice(0, 7);
  const maxMes = fechaMax?.slice(0, 7);
  const mesDesde = [periodo.desde, minMes].filter(Boolean).sort().pop();
  const mesHasta = [periodo.hasta, maxMes].filter(Boolean).sort()[0];

  const geom = useMemo(() => {
    if (puntos.length === 0) return null;
    const valores = puntos.map((p) => valorDeCapa(p, capa));
    const incompletos = puntos.map((p) => esIncompleto(p, granularidad, mesDesde, mesHasta));
    const techo = Math.max(
      1,
      ...valores.filter((v): v is number => v !== null),
      ...(capa === 'armonizado' ? puntos.map((p) => p.maximo) : []),
    );
    const n = puntos.length;
    const x = (i: number) => PAD.left + (n === 1 ? 0.5 : i / (n - 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - v / techo) * (H - PAD.top - PAD.bottom);

    // Tramos completos (línea llena) e incompletos (punteada); null corta la línea
    let llena = '';
    let punteada = '';
    for (let i = 1; i < n; i++) {
      const a = valores[i - 1];
      const b = valores[i];
      if (a === null || b === null) continue;
      const seg = `M${x(i - 1).toFixed(1)},${y(a).toFixed(1)}L${x(i).toFixed(1)},${y(b).toFixed(1)}`;
      if (incompletos[i - 1] || incompletos[i]) punteada += seg;
      else llena += seg;
    }

    // Rango nominal del 80 % para tramos estimados o mixtos de la capa armonizada.
    let banda = '';
    if (capa === 'armonizado') {
      let tramo: number[] = [];
      const cerrar = () => {
        if (tramo.length > 1) {
          const arriba = tramo.map((i) => `${x(i).toFixed(1)},${y(puntos[i].maximo).toFixed(1)}`);
          const abajo = [...tramo].reverse().map((i) => `${x(i).toFixed(1)},${y(puntos[i].minimo).toFixed(1)}`);
          banda += `M${arriba.join('L')}L${abajo.join('L')}Z`;
        }
        tramo = [];
      };
      puntos.forEach((p, i) => (p.estado !== 'observado' ? tramo.push(i) : cerrar()));
      cerrar();
    }

    const ticksY = [0, techo / 2, techo];
    // Etiquetas del eje X según el espacio disponible (~70 px por etiqueta)
    const maxEtiquetas = Math.max(2, Math.floor((W - PAD.left - PAD.right) / 70));
    const ticksX =
      granularidad === 'anio'
        ? puntos
            .map((p, i) => ({ i, label: p.periodo }))
            .filter(({ i }) => i % Math.max(1, Math.ceil(n / maxEtiquetas)) === 0)
        : (() => {
            // Serie mensual: una etiqueta por enero, cada `pasoAnios` años
            const pasoAnios = Math.max(1, Math.ceil(n / 12 / maxEtiquetas));
            return puntos
              .map((p, i) => ({ i, label: p.periodo.slice(0, 4), mes: p.periodo.slice(5, 7) }))
              .filter(({ label, mes }) => mes === '01' && Number(label) % pasoAnios === 0);
          })();
    return { x, y, llena, punteada, banda, ticksY, ticksX, valores, incompletos };
  }, [puntos, capa, granularidad, mesDesde, mesHasta, W, H]);

  const fmt = (v: number | null) => (v === null ? sinDato : Math.round(v).toLocaleString(locale));
  const compact = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v)}`);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geom || puntos.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const n = puntos.length;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    setHoverIdx(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  };

  const hp = hoverIdx !== null ? puntos[hoverIdx] : null;
  const hayIncompletos = geom?.incompletos.some(Boolean);
  const etiquetaIncompletos = geom
    ? puntos.filter((_, i) => geom.incompletos[i]).map((p) => p.periodo).join(isEn ? ' and ' : ' y ')
    : '';

  return (
    <div role="region" aria-label={isEn ? 'Time series' : 'Serie temporal'} aria-busy={isLoading || isFetching} className={`p-4 text-[#EFF5ED] ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21312D] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <LineChart className="h-4 w-4 shrink-0 text-[#B8EE68]" aria-hidden="true" />
          <h3 className="font-title text-sm md:text-base font-bold">{isEn ? 'Time series' : 'Serie temporal'}</h3>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B8EE68]" />}
          <span className="truncate text-xs text-[#93A39C]">
            · {zonaNombre} · {capa === 'armonizado' ? (isEn ? 'Harmonized' : 'Armonizado') : capa.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-[#21312D] bg-[#111E1B] p-1 font-sans text-xs">
          {(['anio', 'mes'] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={granularidad === g}
              onClick={() => {
                setGranularidad(g);
                setHoverIdx(null);
              }}
              className={`rounded px-2.5 py-1 font-semibold ${granularidad === g ? 'bg-[#B8EE68] text-[#07100F]' : 'text-[#93A39C] hover:text-[#EFF5ED]'}`}
            >
              {g === 'anio' ? (isEn ? 'Yearly' : 'Anual') : isEn ? 'Monthly' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-md border border-[#FF6759]/40 bg-[#FF6759]/10 px-2.5 py-1.5 text-xs text-[#FF6759]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{error.message}</span>
        </p>
      )}

      <div ref={contRef} className="mt-3 w-full">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-[#93A39C]" style={{ height: H }}>
            <Loader2 className="h-4 w-4 animate-spin text-[#B8EE68]" />
            {isEn ? `Loading ${zonaNombre}…` : `Cargando ${zonaNombre}…`}
          </div>
        )}

        {geom && (
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className={`block select-none transition-opacity duration-150 ${desactualizado ? 'opacity-40' : ''}`}
            data-desactualizado={desactualizado ? 'true' : undefined}
            onMouseMove={onMove}
            onMouseLeave={() => setHoverIdx(null)}
            role="img"
            aria-label={isEn ? `Fire spots per ${granularidad === 'anio' ? 'year' : 'month'}` : `Focos por ${granularidad === 'anio' ? 'año' : 'mes'}`}
          >
            {geom.ticksY.map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={W - PAD.right} y1={geom.y(v)} y2={geom.y(v)} stroke="#21312D" strokeWidth={1} />
                <text x={PAD.left - 8} y={geom.y(v) + 4} textAnchor="end" fontSize={FONT} fill="#93A39C" fontFamily="DM Mono, monospace">
                  {compact(v)}
                </text>
              </g>
            ))}
            {geom.ticksX.map(({ i, label }) => (
              <text key={`${label}-${i}`} x={geom.x(i)} y={H - 6} textAnchor="middle" fontSize={FONT} fill="#93A39C" fontFamily="DM Mono, monospace">
                {label}
              </text>
            ))}
            {geom.banda && <path d={geom.banda} fill={color} opacity={0.14} />}
            <path d={geom.llena} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={geom.punteada} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 4" opacity={0.6} />
            {granularidad === 'anio' &&
              puntos.map((_, i) =>
                geom.valores[i] === null ? null : (
                  <circle
                    key={i}
                    cx={geom.x(i)}
                    cy={geom.y(geom.valores[i]!)}
                    r={geom.incompletos[i] ? 3.5 : 2.5}
                    fill={geom.incompletos[i] ? '#0D1816' : color}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                ),
              )}
            {hoverIdx !== null && (
              <g>
                <line x1={geom.x(hoverIdx)} x2={geom.x(hoverIdx)} y1={PAD.top} y2={H - PAD.bottom} stroke="#93A39C" strokeDasharray="3 3" />
                {geom.valores[hoverIdx] !== null && (
                  <circle cx={geom.x(hoverIdx)} cy={geom.y(geom.valores[hoverIdx]!)} r={4.5} fill={color} stroke="#07100F" strokeWidth={1.5} />
                )}
              </g>
            )}
          </svg>
        )}
      </div>

      {geom && (
        <div className="mt-1 flex min-h-[1.5rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-xs text-[#93A39C]">
          <span>
            {hp ? (
              <>
                <span className="font-semibold text-[#EFF5ED]">{hp.periodo}</span> · {fmt(valorDeCapa(hp, capa))} {isEn ? 'spots' : 'focos'}
                {hp.estado !== 'observado' && capa === 'armonizado' && ` (${fmt(hp.minimo)}–${fmt(hp.maximo)})`} · {hp.estado}
                {hoverIdx !== null && geom.incompletos[hoverIdx] && (isEn ? ' · incomplete period' : ' · período incompleto')}
              </>
            ) : capa === 'armonizado' ? (
              t(granularidad === 'mes' ? 'calendar.rangeBand' : 'calendar.annualRangeBand')
            ) : capa === 'viirs' ? (
              isEn ? 'VIIRS has no data before 2012 (the line starts there).' : 'VIIRS no tiene dato antes de 2012 (la línea empieza ahí).'
            ) : isEn ? (
              'Raw MODIS counts.'
            ) : (
              'Conteos crudos de MODIS.'
            )}
          </span>
          {hayIncompletos && (
            <span className="flex items-center gap-1.5">
              <svg width="22" height="8" aria-hidden="true">
                <line x1="0" x2="22" y1="4" y2="4" stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
              </svg>
              {isEn ? `Incomplete: ${etiquetaIncompletos}` : `Incompleto: ${etiquetaIncompletos}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
