import React, { useState } from 'react';
import { Calendar, Table } from 'lucide-react';

interface CalendarHeatmapWidgetProps {
  zonaNombre: string;
  capa: 'armonizado' | 'modis' | 'viirs';
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const YEARS = Array.from({ length: 25 }, (_, i) => 2024 - i); // 2024 a 2000

export const CalendarHeatmapWidget: React.FC<CalendarHeatmapWidgetProps> = ({
  zonaNombre,
  capa,
}) => {
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
      aria-label="Calendario de actividad de quemas"
      className="rounded-xl border border-[#21312D] bg-[#0D1816] p-4 text-[#EFF5ED] shadow-md"
    >
      {/* Encabezado del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21312D] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#B8EE68]" />
            <h3 className="font-title text-sm md:text-base font-bold text-[#EFF5ED]">
              Calendario Armonizado mes × año
            </h3>
            <span className="rounded bg-[#B8EE68]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#B8EE68]">
              2000 → hoy
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#93A39C]">
            Focos en <span className="text-[#EFF5ED] font-semibold">{zonaNombre}</span> ({capa})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTableView((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded border border-[#21312D] bg-[#111E1B] px-2.5 py-1 font-mono text-[11px] text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#B8EE68]/40"
          >
            <Table className="h-3 w-3" />
            <span>{showTableView ? 'Ver Matriz' : 'Ver Tabla'}</span>
          </button>
        </div>
      </div>

      {/* Resumen de máximos históricos */}
      <div className="my-2.5 flex flex-wrap items-center justify-between rounded-lg bg-[#07100F] px-3 py-1.5 font-mono text-xs border border-[#21312D]">
        <div className="flex items-center gap-2">
          <span className="text-[#93A39C]">Pico mensual histórico:</span>
          <span className="font-bold text-[#FF6759]">Agosto 2020 (4.812 focos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#93A39C]">Año con más fuego:</span>
          <span className="font-bold text-[#FF9C55]">2020</span>
        </div>
      </div>

      {/* Matriz Heatmap o Vista en Tabla */}
      {!showTableView ? (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[480px]">
            {/* Cabecera de meses */}
            <div className="grid grid-cols-13 gap-1 text-center font-mono text-[10px] text-[#93A39C] pb-1">
              <div className="text-left font-bold pl-1">Año</div>
              {MONTHS.map((m) => (
                <div key={m}>{m}</div>
              ))}
            </div>

            {/* Filas de años */}
            <div className="flex flex-col gap-1">
              {YEARS.map((year) => {
                const isCurrentYear = year === 2024;
                return (
                  <div key={year} className="grid grid-cols-13 gap-1 items-center">
                    <span
                      className={`font-mono text-[10px] pl-1 ${
                        isCurrentYear ? 'font-bold text-[#B8EE68]' : 'text-[#93A39C]'
                      }`}
                    >
                      {year}
                    </span>

                    {MONTHS.map((_, mIdx) => {
                      const data = getCellData(year, mIdx);
                      const isNoData = data.val === null;
                      const cellColor = getCellColor(data.val);

                      return (
                        <div
                          key={mIdx}
                          tabIndex={isNoData ? -1 : 0}
                          role="gridcell"
                          aria-label={`${MONTHS[mIdx]} ${year}: ${
                            isNoData ? 'sin dato' : `${data.val} focos ${data.isEstimated ? '(estimado)' : ''}`
                          }`}
                          onMouseEnter={() =>
                            !isNoData &&
                            setHoveredCell({
                              year,
                              month: mIdx,
                              val: data.val!,
                              isEstimated: data.isEstimated,
                              modis: data.modis ?? 0,
                              viirs: data.viirs,
                            })
                          }
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`relative h-4 rounded-sm transition-transform hover:scale-125 hover:z-20 cursor-pointer ${
                            data.isEstimated ? 'pattern-estimado' : ''
                          } ${isCurrentYear && mIdx === 9 ? 'ring-1 ring-[#B8EE68]' : ''}`}
                          style={{
                            backgroundColor: cellColor,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Vista de tabla accesible */
        <div className="max-h-[300px] overflow-y-auto font-mono text-xs border border-[#21312D] rounded-lg mt-2">
          <table className="w-full text-left">
            <thead className="bg-[#111E1B] text-[#93A39C] sticky top-0">
              <tr>
                <th className="p-2">Año</th>
                <th className="p-2">Mes</th>
                <th className="p-2">Focos</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">MODIS</th>
                <th className="p-2">VIIRS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21312D]">
              {YEARS.slice(0, 10).map((year) =>
                MONTHS.slice(6, 10).map((m, mIdx) => {
                  const data = getCellData(year, mIdx + 6);
                  return (
                    <tr key={`${year}-${m}`} className="hover:bg-[#111E1B]/50">
                      <td className="p-2 font-bold">{year}</td>
                      <td className="p-2">{m}</td>
                      <td className="p-2 text-[#EFF5ED]">{data.val ?? 'sin dato'}</td>
                      <td className="p-2">
                        {data.isEstimated ? (
                          <span className="text-[#FF9C55]">Estimado (MODIS)</span>
                        ) : (
                          <span className="text-[#68D9D0]">Observado</span>
                        )}
                      </td>
                      <td className="p-2">{data.modis ?? '—'}</td>
                      <td className="p-2">{data.viirs ?? 'sin dato'}</td>
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
              {MONTHS[hoveredCell.month]} {hoveredCell.year}
            </span>
            <span className="text-[11px] text-[#93A39C]">
              {hoveredCell.isEstimated ? '⚠️ Valor estimado (antes de 2012)' : '✓ Sensor VIIRS activo'}
            </span>
          </div>
          <div className="mt-1 text-xs">
            <span className="text-base font-bold text-[#EFF5ED]">
              {hoveredCell.val.toLocaleString('es-AR')} focos
            </span>
            {hoveredCell.isEstimated && (
              <span className="ml-1 text-[11px] text-[#93A39C]">
                (rango: {Math.round(hoveredCell.val * 0.8)} – {Math.round(hoveredCell.val * 1.25)})
              </span>
            )}
          </div>
          <div className="mt-1 flex gap-3 text-[11px] text-[#93A39C] border-t border-[#21312D] pt-1">
            <span>MODIS: {hoveredCell.modis}</span>
            <span>VIIRS: {hoveredCell.viirs !== null ? hoveredCell.viirs : 'sin dato (inició 2012)'}</span>
          </div>
        </div>
      )}

      {/* Leyenda científica de colores y texturas */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#21312D] pt-3 font-mono text-[11px] text-[#93A39C]">
        <div className="flex items-center gap-1.5">
          <span>Menos fuego</span>
          <div className="flex h-3 gap-0.5">
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#1A332C' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#285448' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#3D786E' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#C48220' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#FF9C55' }} />
            <span className="w-3 rounded-sm" style={{ backgroundColor: '#FF6759' }} />
          </div>
          <span className="text-[#FF6759]">Más fuego</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-3 w-5 rounded border border-[#93A39C] bg-[#285448] pattern-estimado" />
            <span>Estimado (pre-2012)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-[#111E1B] border border-[#21312D]" />
            <span>Sin dato</span>
          </div>
        </div>
      </div>
    </div>
  );
};
