import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Table } from 'lucide-react';

interface CalendarHeatmapWidgetProps {
  zonaNombre: string;
  capa: 'armonizado' | 'modis' | 'viirs';
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = Array.from({ length: 25 }, (_, i) => 2024 - i); // 2024 a 2000

export const CalendarHeatmapWidget: React.FC<CalendarHeatmapWidgetProps> = ({
  zonaNombre,
  capa,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));
  const months = isEn ? MONTHS_EN : MONTHS_ES;
  const locale = isEn ? 'en-US' : 'es-AR';

  const [hoveredCell, setHoveredCell] = useState<{
    year: number;
    month: number;
    val: number;
    isEstimated: boolean;
    modis: number;
    viirs: number | null;
  } | null>(null);

  const [showTableView, setShowTableView] = useState(false);

  // Generador determinista de valores representativos con picos estacionales de incendios (Agosto–Octubre)
  const getCellData = (year: number, monthIndex: number) => {
    // Meses antes de Nov 2000 no tienen datos
    if (year === 2000 && monthIndex < 10) {
      return { val: null, isEstimated: false, modis: null, viirs: null };
    }

    const isEstimated = year < 2012;
    // Patrón estacional argentino: pico en Ago(7), Sep(8), Oct(9)
    const seasonalFactor =
      monthIndex === 7 ? 4.5 : monthIndex === 8 ? 5.2 : monthIndex === 9 ? 3.8 : monthIndex === 6 ? 2.5 : 1.0;

    // Año 2020 fue récord histórico en Argentina (Delta del Paraná, Córdoba)
    const yearExtreme = year === 2020 ? 3.2 : year === 2008 ? 2.4 : 1.0;
    const baseValue = Math.round((45 + ((year * 17 + monthIndex * 31) % 180)) * seasonalFactor * yearExtreme);

    const modisCount = Math.round(baseValue / 2.8);
    const viirsCount = isEstimated ? null : Math.round(baseValue * 0.95);

    return {
      val: baseValue,
      isEstimated,
      modis: modisCount,
      viirs: viirsCount,
    };
  };

  // Rampa de color del verde apagado (#1A332C) a ámbar (#FF9C55) y rojo (#FF6759)
  const getCellColor = (val: number | null) => {
    if (val === null) return '#111E1B'; // Sin dato
    if (val < 100) return '#1A332C';
    if (val < 300) return '#285448';
    if (val < 600) return '#3D786E';
    if (val < 1200) return '#C48220';
    if (val < 2500) return '#FF9C55';
    return '#FF6759';
  };

  return (
    <div
      role="region"
      aria-label={t('calendar.title')}
      className="rounded-xl border border-[#21312D] bg-[#0D1816] p-4 text-[#EFF5ED] shadow-md"
    >
      {/* Encabezado del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21312D] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#B8EE68]" />
            <h3 className="font-title text-sm md:text-base font-bold text-[#EFF5ED]">
              {t('calendar.title')}
            </h3>
            <span className="rounded bg-[#B8EE68]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#B8EE68]">
              {t('calendar.badge')}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#93A39C]">
            {t('calendar.subtitle')} <span className="text-[#EFF5ED] font-semibold">{zonaNombre}</span> ({capa})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTableView((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-[#21312D] bg-[#111E1B] px-2.5 py-1 font-mono text-[11px] text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#B8EE68]/40"
          >
            <Table className="h-3 w-3" />
            <span>{showTableView ? t('calendar.viewMatrix') : t('calendar.viewTable')}</span>
          </button>
        </div>
      </div>

      {/* Resumen de máximos históricos */}
      <div className="my-2.5 flex flex-wrap items-center justify-between rounded-lg bg-[#07100F] px-3 py-1.5 font-mono text-xs border border-[#21312D]">
        <div className="flex items-center gap-2">
          <span className="text-[#93A39C]">{isEn ? 'Historical monthly peak:' : 'Pico mensual histórico:'}</span>
          <span className="font-bold text-[#FF6759]">
            {isEn ? 'August 2020 (4,812 spots)' : 'Agosto 2020 (4.812 focos)'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#93A39C]">{isEn ? 'Year with most fire:' : 'Año con más fuego:'}</span>
          <span className="font-bold text-[#FF9C55]">2020</span>
        </div>
      </div>

      {/* Matriz Heatmap o Vista en Tabla */}
      {!showTableView ? (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[480px]">
            {/* Cabecera con meses */}
            <div className="grid grid-cols-[48px_repeat(12,1fr)] gap-1 mb-1 font-mono text-[11px] text-[#93A39C] text-center">
              <span className="text-left pl-1">{isEn ? 'Year' : 'Año'}</span>
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>

            {/* Filas de años */}
            <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto pr-1">
              {YEARS.map((year) => (
                <div
                  key={year}
                  className="grid grid-cols-[48px_repeat(12,1fr)] gap-1 items-center"
                >
                  <span className="font-mono text-[11px] font-semibold text-[#93A39C]">
                    {year}
                  </span>

                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const data = getCellData(year, monthIdx);
                    const bgColor = getCellColor(data.val);

                    return (
                      <div
                        key={monthIdx}
                        onMouseEnter={() =>
                          data.val !== null &&
                          setHoveredCell({
                            year,
                            month: monthIdx,
                            val: data.val,
                            isEstimated: data.isEstimated,
                            modis: data.modis!,
                            viirs: data.viirs,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`group relative h-6 rounded-sm transition-transform duration-100 hover:scale-110 hover:z-20 cursor-pointer ${
                          data.isEstimated ? 'pattern-estimado' : ''
                        }`}
                        style={{
                          backgroundColor: bgColor,
                          border: data.val === null ? '1px dashed #21312D' : '1px solid rgba(0,0,0,0.3)',
                        }}
                        role="gridcell"
                        aria-label={`${months[monthIdx]} ${year}: ${
                          data.val !== null ? `${data.val} ${isEn ? 'spots' : 'focos'}` : t('calendar.noDataLegend')
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de Tabla accesible */
        <div className="max-h-[380px] overflow-auto">
          <table className="w-full font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#21312D] text-[#93A39C]">
                <th className="py-2 text-left">{isEn ? 'Year' : 'Año'}</th>
                <th className="py-2 text-left">{isEn ? 'Month' : 'Mes'}</th>
                <th className="py-2 text-right">{isEn ? 'Harmonized Spots' : 'Focos Armonizados'}</th>
                <th className="py-2 text-right">MODIS</th>
                <th className="py-2 text-right">VIIRS</th>
                <th className="py-2 text-center">{isEn ? 'Status' : 'Estado'}</th>
              </tr>
            </thead>
            <tbody>
              {YEARS.slice(0, 10).map((year) =>
                Array.from({ length: 12 }, (_, monthIdx) => {
                  const data = getCellData(year, monthIdx);
                  if (data.val === null) return null;
                  return (
                    <tr
                      key={`${year}-${monthIdx}`}
                      className="border-b border-[#21312D]/40 hover:bg-[#111E1B]"
                    >
                      <td className="py-1 text-[#EFF5ED]">{year}</td>
                      <td className="py-1 text-[#93A39C]">{months[monthIdx]}</td>
                      <td className="py-1 text-right font-bold text-[#EFF5ED]">
                        {data.val.toLocaleString(locale)}
                      </td>
                      <td className="py-1 text-right text-[#68D9D0]">{data.modis}</td>
                      <td className="py-1 text-right text-[#FF9C55]">
                        {data.viirs !== null ? data.viirs : '—'}
                      </td>
                      <td className="py-1 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            data.isEstimated
                              ? 'bg-[#FF9C55]/20 text-[#FF9C55]'
                              : 'bg-[#B8EE68]/20 text-[#B8EE68]'
                          }`}
                        >
                          {data.isEstimated ? (isEn ? 'Estimated' : 'Estimado') : (isEn ? 'Observed' : 'Observado')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tooltip dinámico contextual */}
      {hoveredCell && (
        <div className="mt-2 rounded-lg border border-[#21312D] bg-[#07100F] p-2.5 font-mono text-xs text-[#EFF5ED] shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#B8EE68]">
              {months[hoveredCell.month]} {hoveredCell.year}
            </span>
            <span className="text-[11px] text-[#93A39C]">
              {hoveredCell.isEstimated
                ? (isEn ? '⚠️ Estimated value (before 2012)' : '⚠️ Valor estimado (antes de 2012)')
                : (isEn ? '✓ Active VIIRS sensor' : '✓ Sensor VIIRS activo')}
            </span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-base font-bold text-[#EFF5ED]">
              {hoveredCell.val.toLocaleString(locale)} {isEn ? 'hot spots' : 'focos'}
            </span>
            {hoveredCell.isEstimated && (
              <span className="ml-1 text-[11px] text-[#93A39C]">
                ({isEn ? 'range' : 'rango'}: {Math.round(hoveredCell.val * 0.8)} – {Math.round(hoveredCell.val * 1.25)})
              </span>
            )}
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-[#93A39C] border-t border-[#21312D] pt-1">
            <span>MODIS: {hoveredCell.modis}</span>
            <span>
              VIIRS: {hoveredCell.viirs !== null ? hoveredCell.viirs : (isEn ? 'no data (started 2012)' : 'sin dato (inició 2012)')}
            </span>
          </div>
        </div>
      )}

      {/* Leyenda científica de colores y texturas */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#21312D] pt-3 font-mono text-[11px] text-[#93A39C]">
        <div className="flex items-center gap-1.5">
          <span>{isEn ? 'Less fire' : 'Menos fuego'}</span>
          <div className="flex h-3 gap-0.5">
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#1A332C' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#285448' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#3D786E' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#C48220' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#FF9C55' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#FF6759' }} />
          </div>
          <span className="text-[#FF6759]">{isEn ? 'More fire' : 'Más fuego'}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-3 w-5 rounded border border-[#93A39C] bg-[#285448] pattern-estimado" />
            <span>{isEn ? 'Estimated (pre-2012)' : 'Estimado (pre-2012)'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-[#111E1B] border border-[#21312D]" />
            <span>{t('calendar.noDataLegend')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
