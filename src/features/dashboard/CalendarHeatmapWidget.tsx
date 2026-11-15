import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Loader2, Hash, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useCalendario, type Capa, type PedidoZona, type PeriodoParams, type Punto } from '../../api';
import {
  CORTES_FIJOS,
  COLOR_CERO,
  colorDeValor,
  coloresEnUso,
  cortesPorZona,
  etiquetasTramos,
  textoSobre,
} from './escalaCalendario';

interface CalendarHeatmapWidgetProps {
  zonaNombre: string;
  capa: Capa;
  pedido: PedidoZona | null;
  periodo?: Omit<PeriodoParams, 'capa'>;
  /** Después de esta fecha los datos son NRT (preliminares). */
  fechaUltimoSp?: string;
  className?: string;
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Valor a mostrar según la capa. null = sin dato (nunca 0). */
const valorDeCapa = (p: Punto, capa: Capa): number | null =>
  capa === 'modis' ? p.modis : capa === 'viirs' ? p.viirs : p.armonizado;

export const CalendarHeatmapWidget: React.FC<CalendarHeatmapWidgetProps> = ({
  zonaNombre,
  capa,
  pedido,
  periodo = {},
  fechaUltimoSp,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));
  const months = isEn ? MONTHS_EN : MONTHS_ES;
  const locale = isEn ? 'en-US' : 'es-AR';
  const spots = isEn ? 'spots' : 'focos';
  const sinDato = isEn ? 'no data' : 'sin dato';

  const { data, isLoading, isFetching, error } = useCalendario(pedido, { ...periodo, capa });

  const mesesMap = useMemo(() => {
    const map = new Map<string, Punto>();
    data?.meses.forEach((m) => map.set(m.periodo, m));
    return map;
  }, [data]);

  // Años presentes en la respuesta, del más reciente al más antiguo
  const years = useMemo(() => {
    const set = new Set<number>();
    data?.meses.forEach((m) => set.add(parseInt(m.periodo.slice(0, 4), 10)));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const mesUltimoSp = fechaUltimoSp?.slice(0, 7);

  const [hovered, setHovered] = useState<Punto | null>(null);
  const [showTableView, setShowTableView] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  // Escala relativa a la zona (por defecto) o fija para comparar zonas entre sí.
  const [escalaFija, setEscalaFija] = useState(false);
  const cortes = useMemo(
    () => (escalaFija ? CORTES_FIJOS : cortesPorZona((data?.meses ?? []).map((p) => valorDeCapa(p, capa)))),
    [escalaFija, data, capa]
  );
  const etiquetas = etiquetasTramos(cortes, locale);
  const confianzaLabel = (c: Punto['confianza']) =>
    c === 'alta' ? (isEn ? 'high confidence' : 'confianza alta') : c === 'media' ? (isEn ? 'medium confidence' : 'confianza media') : isEn ? 'low confidence' : 'confianza baja';

  const fmt = (v: number | null) => (v === null ? sinDato : Math.round(v).toLocaleString(locale));

  // Formato compacto para números dentro de las celdas (0, 45, 1.2k, 18k)
  const formatCellCount = (val: number) => {
    const v = Math.round(val);
    if (v < 1000) return `${v}`;
    if (v < 10000) return `${(v / 1000).toFixed(1).replace('.0', '')}k`;
    return `${Math.round(v / 1000)}k`;
  };

  const getYearTotal = (year: number) => {
    let total = 0;
    let hasData = false;
    for (let m = 1; m <= 12; m++) {
      const p = mesesMap.get(`${year}-${String(m).padStart(2, '0')}`);
      const v = p ? valorDeCapa(p, capa) : null;
      if (v !== null) {
        total += v;
        hasData = true;
      }
    }
    return hasData ? Math.round(total) : null;
  };

  const estadoLabel = (p: Punto) =>
    p.estado === 'observado'
      ? isEn ? 'Observed' : 'Observado'
      : p.estado === 'estimado'
        ? isEn ? 'Estimated' : 'Estimado'
        : isEn ? 'Mixed' : 'Mixto';

  const peak = useMemo(() => {
    const maxMes = data?.resumen.max_mes;
    if (!maxMes) return null;
    const [y, m] = maxMes.split('-');
    const p = mesesMap.get(maxMes);
    const v = p ? valorDeCapa(p, capa) : null;
    return `${months[parseInt(m, 10) - 1]} ${y}${v !== null ? ` (${fmt(v)} ${spots})` : ''}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mesesMap, capa, months, locale]);

  // La API devuelve la unidad en español; en inglés se traduce la conocida.
  const unidad =
    isEn && data?.unidad === 'focos (escala VIIRS S-NPP)'
      ? 'spots (VIIRS S-NPP scale)'
      : isEn && data?.unidad.startsWith('focos')
        ? data.unidad.replace(/^focos/, 'spots')
        : data?.unidad ?? '';
  const capaLabel = capa === 'armonizado' ? (isEn ? 'Harmonized' : 'Armonizado') : capa.toUpperCase();

  return (
    <div role="region" aria-label={t('calendar.title')} aria-busy={isLoading} className={`bg-[#0D1816] p-4 text-[#EFF5ED] ${className}`}>
      {/* Encabezado */}
      <div className={`flex flex-col gap-2 ${isExpanded ? 'border-b border-[#21312D] pb-3' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="font-title text-sm md:text-base font-bold text-[#EFF5ED]">{t('calendar.title')}</h3>
            {isFetching && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#B8EE68]" />}
          </div>
          <div className="flex items-center gap-1.5">
            {isExpanded && !showTableView && (
              <button
                type="button"
                onClick={() => setShowNumbers((prev) => !prev)}
                aria-pressed={showNumbers}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 font-sans text-xs text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#2A3F3A] transition-colors"
              >
                <Hash className="h-3.5 w-3.5" />
                <span>{showNumbers ? (isEn ? 'Hide values' : 'Ocultar valores') : (isEn ? 'Show values' : 'Mostrar valores')}</span>
              </button>
            )}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setShowTableView((prev) => !prev)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 font-sans text-xs text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#2A3F3A] transition-colors"
              >
                <Table className="h-3.5 w-3.5" />
                <span>{showTableView ? t('calendar.viewMatrix') : t('calendar.viewTable')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              aria-controls="calendar-heatmap-content"
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 font-sans text-xs text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#2A3F3A] transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>{isExpanded ? (isEn ? 'Collapse' : 'Ocultar') : (isEn ? 'Expand' : 'Desplegar')}</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-[#93A39C]">
          {t('calendar.subtitle')} <span className="text-[#EFF5ED] font-semibold">{zonaNombre}</span>
          {' · '}
          {capaLabel}
          {data && (
            <span className="font-mono text-[#B8EE68]/90">
              {' · '}
              {data.meses[0]?.periodo.slice(0, 4)}–{data.meses[data.meses.length - 1]?.periodo.slice(0, 4)}
              {' · '}
              {unidad}
            </span>
          )}
        </p>
      </div>

      {isExpanded && (
        <div id="calendar-heatmap-content">

      {error && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-md border border-[#FF6759]/40 bg-[#FF6759]/10 px-2.5 py-1.5 text-xs text-[#FF6759]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{error.message}</span>
        </p>
      )}

      {isLoading && (
        <div className="mt-3 flex h-40 items-center justify-center gap-2 rounded-lg border border-dashed border-[#21312D] text-xs text-[#93A39C]">
          <Loader2 className="h-4 w-4 animate-spin text-[#B8EE68]" />
          {isEn ? 'Loading calendar…' : 'Cargando calendario…'}
        </div>
      )}

      {data && (
        <>
          {/* Resumen */}
          <div className="my-2.5 flex flex-wrap items-center justify-between gap-y-2 rounded-lg bg-[#07100F] px-3 py-1.5 font-sans text-xs border border-[#21312D]">
            <div className="flex items-center gap-2">
              <span className="text-[#93A39C]">{isEn ? 'Peak month:' : 'Pico mensual:'}</span>
              <span className="font-mono tabular-nums font-bold text-[#FF6759]">{peak ?? sinDato}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#93A39C]">{isEn ? 'Total in period:' : 'Total del período:'}</span>
              <span className="font-mono tabular-nums font-bold text-[#B8EE68]">
                {data.resumen.total === null ? sinDato : `${fmt(data.resumen.total)} ${spots}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#93A39C]">{isEn ? 'Year with most fire:' : 'Año con más fuego:'}</span>
              <span className="font-mono tabular-nums font-bold text-[#FF9C55]">{data.resumen.max_anio ?? sinDato}</span>
            </div>
          </div>

          {!showTableView ? (
            <div className="overflow-x-auto pb-1">
              <div className="w-full min-w-[360px]">
                <div className="grid grid-cols-[38px_repeat(12,minmax(0,1fr))_46px] gap-0.5 sm:gap-1 mb-1 font-mono text-[10px] sm:text-xs text-[#93A39C] text-center items-center">
                  <span className="text-left pl-0.5">{isEn ? 'Year' : 'Año'}</span>
                  {months.map((m) => (
                    <span key={m} className="truncate">{m}</span>
                  ))}
                  <span className="text-right pr-0.5 font-semibold text-[#EFF5ED]">Total</span>
                </div>

                <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-0.5" role="grid">
                  {years.map((year) => {
                    const yearTotal = getYearTotal(year);
                    return (
                      <div key={year} role="row" className="grid grid-cols-[38px_repeat(12,minmax(0,1fr))_46px] gap-0.5 sm:gap-1 items-center">
                        <span className="font-mono text-xs font-semibold text-[#93A39C]">{year}</span>

                        {Array.from({ length: 12 }, (_, monthIdx) => {
                          const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
                          const p = mesesMap.get(key);
                          if (!p) {
                            // Fuera del período consultado
                            return <div key={monthIdx} className="h-7 sm:h-8 rounded-sm" style={{ border: '1px dashed #1A2724' }} aria-hidden="true" />;
                          }
                          const val = valorDeCapa(p, capa);
                          const pattern = p.estado === 'estimado' ? 'pattern-estimado' : p.estado === 'mixto' ? 'pattern-mixto' : '';
                          const fondo = colorDeValor(val, cortes);
                          return (
                            <div
                              key={monthIdx}
                              onMouseEnter={() => setHovered(p)}
                              onFocus={() => setHovered(p)}
                              onMouseLeave={() => setHovered(null)}
                              onBlur={() => setHovered(null)}
                              tabIndex={0}
                              className={`group relative h-7 sm:h-8 rounded-sm transition-transform duration-100 hover:scale-110 hover:z-20 focus:z-20 focus:outline focus:outline-1 focus:outline-[#B8EE68] cursor-pointer flex items-center justify-center ${pattern}`}
                              style={{
                                backgroundColor: fondo,
                                border: p.parcial
                                  ? '1px solid #B8EE68'
                                  : val === null
                                    ? '1px dashed #2A3F3A'
                                    : p.estado === 'mixto'
                                      ? '1px dashed rgba(255,156,85,0.55)'
                                      : '1px solid rgba(0,0,0,0.3)',
                              }}
                              role="gridcell"
                              aria-label={`${months[monthIdx]} ${year}: ${val === null ? sinDato : `${fmt(val)} ${spots}`} · ${estadoLabel(p)} · ${confianzaLabel(p.confianza)}${p.parcial ? (isEn ? ' · month in progress' : ' · mes en curso') : ''}`}
                              data-confianza={p.confianza}
                            >
                              {p.confianza !== 'alta' && val !== null && (
                                // Confianza fuera del color: anillo = media, punto lleno = baja.
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full"
                                  style={
                                    p.confianza === 'baja'
                                      ? { background: textoSobre(fondo) }
                                      : { border: `1px solid ${textoSobre(fondo)}` }
                                  }
                                />
                              )}
                              {showNumbers && val !== null && (
                                <span
                                  className={`font-mono text-[9px] sm:text-[10px] tabular-nums font-semibold select-none leading-none pointer-events-none ${
                                    Math.round(val) === 0 ? 'text-[#475753]' : ''
                                  }`}
                                  style={Math.round(val) === 0 ? undefined : { color: textoSobre(fondo) }}
                                >
                                  {formatCellCount(val)}
                                </span>
                              )}
                              {showNumbers && val === null && (
                                <span className="font-mono text-[9px] text-[#475753] select-none pointer-events-none">—</span>
                              )}
                            </div>
                          );
                        })}

                        <div className="font-mono text-xs font-semibold tabular-nums text-right pr-1 text-[#FF9C55]" title={`Total ${year}: ${yearTotal !== null ? yearTotal.toLocaleString(locale) : sinDato}`}>
                          {yearTotal !== null ? (yearTotal >= 1000 ? `${(yearTotal / 1000).toFixed(1)}k` : yearTotal) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#21312D] font-sans font-semibold text-[#93A39C]">
                    <th className="py-2 text-left">{isEn ? 'Period' : 'Período'}</th>
                    <th className="py-2 text-right">{isEn ? 'Harmonized' : 'Armonizado'}</th>
                    <th className="py-2 text-right">{isEn ? 'Range 80%' : 'Rango 80 %'}</th>
                    <th className="py-2 text-right">MODIS</th>
                    <th className="py-2 text-right">VIIRS</th>
                    <th className="py-2 text-center">{isEn ? 'Status' : 'Estado'}</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {[...data.meses].reverse().map((p) => (
                    <tr key={p.periodo} className="border-b border-[#21312D]/40 hover:bg-[#111E1B]">
                      <td className="py-1 text-[#EFF5ED]">
                        {p.periodo}
                        {p.parcial && <span className="ml-1 text-[#B8EE68]">*</span>}
                      </td>
                      <td className="py-1 text-right font-bold text-[#EFF5ED]">{fmt(p.armonizado)}</td>
                      <td className="py-1 text-right text-[#93A39C]">
                        {p.estado === 'observado' ? '—' : `${fmt(p.minimo)}–${fmt(p.maximo)}`}
                      </td>
                      <td className="py-1 text-right text-[#68D9D0]">{fmt(p.modis)}</td>
                      <td className="py-1 text-right text-[#FF9C55]">{fmt(p.viirs)}</td>
                      <td className="py-1 text-center font-sans">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${p.estado === 'observado' ? 'bg-[#B8EE68]/20 text-[#B8EE68]' : 'bg-[#FF9C55]/20 text-[#FF9C55]'}`}>
                          {estadoLabel(p)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detalle del mes bajo el cursor */}
          {hovered && (
            <div className="mt-2 rounded-lg border border-[#21312D] bg-[#07100F] p-2.5 text-xs text-[#EFF5ED] animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="font-title font-bold text-[#B8EE68]">
                  {months[parseInt(hovered.periodo.slice(5, 7), 10) - 1]} {hovered.periodo.slice(0, 4)}
                  {hovered.parcial && (
                    <span className="ml-2 rounded bg-[#B8EE68]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#B8EE68]">
                      {isEn ? 'month in progress' : 'mes en curso'}
                    </span>
                  )}
                  {mesUltimoSp && hovered.periodo > mesUltimoSp && (
                    <span className="ml-2 rounded bg-[#FF9C55]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#FF9C55]">
                      {isEn ? 'preliminary' : 'preliminar'}
                    </span>
                  )}
                </span>
                <span className="font-sans text-xs text-[#93A39C]">
                  {estadoLabel(hovered)}
                  {hovered.estado !== 'observado' &&
                    ` · ${Math.round(hovered.frac_estimada * 100)} % ${isEn ? 'of days estimated' : 'de los días estimados'}`}
                </span>
              </div>
              <div className="mt-1 text-xs">
                <span className="font-mono tabular-nums text-base font-bold text-[#EFF5ED]">{fmt(valorDeCapa(hovered, capa))}</span>{' '}
                <span className="font-sans text-xs text-[#EFF5ED]">
                  {valorDeCapa(hovered, capa) === null
                    ? isEn ? '(no VIIRS data for this month)' : '(no hay dato VIIRS para este mes)'
                    : isEn ? 'spots in the month' : 'focos en el mes'}
                </span>
                {hovered.estado !== 'observado' && capa === 'armonizado' && (
                  <span className="ml-1 font-mono text-xs text-[#93A39C]">
                    ({isEn ? 'between' : 'entre'} {fmt(hovered.minimo)} {isEn ? 'and' : 'y'} {fmt(hovered.maximo)}, 80 %)
                  </span>
                )}
                <span className="ml-2 rounded bg-[#111E1B] px-1.5 py-0.5 font-mono text-[10px] text-[#68D9D0] border border-[#21312D]">
                  {isEn ? 'Confidence' : 'Confianza'}: {hovered.confianza}
                </span>
              </div>
              <div className="mt-1 flex gap-3 font-mono tabular-nums text-xs text-[#93A39C] border-t border-[#21312D] pt-1">
                <span>MODIS: {fmt(hovered.modis)}</span>
                <span>VIIRS: {fmt(hovered.viirs)}</span>
                <span>{isEn ? 'Harmonized' : 'Armonizado'}: {fmt(hovered.armonizado)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#21312D] pt-3 font-sans text-xs text-[#93A39C]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#C8D3CE]">{isEn ? 'Spots/month' : 'Focos/mes'}</span>
          <div className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border border-[#162420]" style={{ backgroundColor: COLOR_CERO }} />
            <span>0</span>
          </div>
          {coloresEnUso(cortes).map((c, i) => (
            <div key={c} className="flex items-center gap-1" data-testid="tramo-leyenda">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
              <span className="tabular-nums">{etiquetas[i] ?? (isEn ? '> 0' : '> 0')}</span>
            </div>
          ))}
          <div className="ml-1 flex rounded border border-[#21312D] p-0.5" role="group" aria-label={isEn ? 'Color scale' : 'Escala de color'}>
            {[false, true].map((fija) => (
              <button
                key={String(fija)}
                type="button"
                aria-pressed={escalaFija === fija}
                onClick={() => setEscalaFija(fija)}
                className={`rounded px-1.5 py-0.5 ${escalaFija === fija ? 'bg-[#21312D] text-[#EFF5ED]' : 'text-[#93A39C] hover:text-[#EFF5ED]'}`}
                title={
                  fija
                    ? isEn ? 'Same scale for every zone: compare zones' : 'Misma escala para todas las zonas: sirve para comparar'
                    : isEn ? 'Scale fitted to this zone and period' : 'Escala ajustada a esta zona y período'
                }
              >
                {fija ? (isEn ? 'Fixed' : 'Fija') : isEn ? 'This zone' : 'Esta zona'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-3 w-5 rounded border border-[#93A39C] bg-[#6A3519] pattern-estimado" />
            <span>{isEn ? 'Estimated' : 'Estimado'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-5 rounded bg-[#6A3519] pattern-mixto" style={{ border: '1px dashed rgba(255,156,85,0.7)' }} />
            <span>{isEn ? 'Mixed' : 'Mixto'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-[#6A3519] border border-[#B8EE68]" />
            <span>{isEn ? 'In progress' : 'En curso'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-[#111E1B] border border-dashed border-[#2A3F3A]" />
            <span>{t('calendar.noDataLegend')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full border border-[#C8D3CE]" />
            <span>{isEn ? 'Medium confidence' : 'Confianza media'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8D3CE]" />
            <span>{isEn ? 'Low confidence' : 'Confianza baja'}</span>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
