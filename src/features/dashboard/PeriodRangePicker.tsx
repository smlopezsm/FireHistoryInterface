import React, { useState, useRef, useEffect, useMemo } from "react";
import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface Periodo {
  desde: string; // YYYY-MM
  hasta: string; // YYYY-MM
}

interface PeriodRangePickerProps {
  periodo: Periodo;
  onChangePeriodo: (periodo: Periodo) => void;
  mesMin?: string;
  mesMax?: string;
  isEn: boolean;
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const shiftMonth = (ym: string, deltaMonths: number): string => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + deltaMonths, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthDiffInclusive = (fromYm: string, toYm: string): number => {
  if (!fromYm || !toYm || toYm < fromYm) return 0;
  const [fy, fm] = fromYm.split("-").map(Number);
  const [ty, tm] = toYm.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
};

const formatMonthLabel = (ym: string, months: string[]): string => {
  if (!ym || !ym.includes("-")) return ym || "—";
  const [y, m] = ym.split("-");
  const idx = parseInt(m, 10) - 1;
  return `${months[idx] ?? m} ${y}`;
};

export const PeriodRangePicker: React.FC<PeriodRangePickerProps> = ({
  periodo,
  onChangePeriodo,
  mesMin = "2000-11",
  mesMax = "2026-11",
  isEn,
}) => {
  const months = isEn ? MONTHS_EN : MONTHS_ES;
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  const effectiveMax = periodo.hasta || mesMax;
  const effectiveMin = periodo.desde || mesMin;

  const minYear = parseInt(mesMin.slice(0, 4), 10);
  const maxYear = parseInt(mesMax.slice(0, 4), 10);

  const [viewYear, setViewYear] = useState<number>(() =>
    parseInt((effectiveMax || mesMax).slice(0, 4), 10)
  );

  useEffect(() => {
    if (isOpen) {
      const targetYear = parseInt((effectiveMax || mesMax).slice(0, 4), 10);
      if (!Number.isNaN(targetYear)) {
        setViewYear(Math.min(maxYear, Math.max(minYear, targetYear)));
      }
      setDraftStart(null);
      setHoveredMonth(null);
    }
  }, [isOpen, effectiveMax, mesMax, minYear, maxYear]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) list.push(y);
    return list;
  }, [minYear, maxYear]);

  const presets = useMemo(() => {
    const clampMin = (ym: string) => (ym < mesMin ? mesMin : ym);
    return [
      {
        id: "full",
        label: isEn ? "Full" : "Todo",
        desde: mesMin,
        hasta: mesMax,
      },
      {
        id: "10y",
        label: isEn ? "10Y" : "10A",
        desde: clampMin(shiftMonth(mesMax, -119)),
        hasta: mesMax,
      },
      {
        id: "5y",
        label: isEn ? "5Y" : "5A",
        desde: clampMin(shiftMonth(mesMax, -59)),
        hasta: mesMax,
      },
      {
        id: "1y",
        label: isEn ? "1Y" : "1A",
        desde: clampMin(shiftMonth(mesMax, -11)),
        hasta: mesMax,
      },
    ];
  }, [mesMin, mesMax, isEn]);

  const activeTotalMonths = monthDiffInclusive(effectiveMin, effectiveMax);
  const durationBadge =
    activeTotalMonths >= 24 && activeTotalMonths % 12 === 0
      ? `${activeTotalMonths / 12}${isEn ? "y" : "a"}`
      : activeTotalMonths > 12
        ? `${Math.floor(activeTotalMonths / 12)}${isEn ? "y" : "a"} ${activeTotalMonths % 12}m`
        : `${activeTotalMonths}m`;

  // Rango visualizado en la grilla (durante selección o rango ya aplicado)
  const [rangeStart, rangeEnd] = useMemo(() => {
    if (draftStart) {
      const target = hoveredMonth ?? draftStart;
      return target < draftStart ? [target, draftStart] : [draftStart, target];
    }
    return [effectiveMin, effectiveMax];
  }, [draftStart, hoveredMonth, effectiveMin, effectiveMax]);

  const handleMonthClick = (ym: string) => {
    if (!draftStart) {
      setDraftStart(ym);
      setHoveredMonth(ym);
      return;
    }
    const [desde, hasta] = ym < draftStart ? [ym, draftStart] : [draftStart, ym];
    onChangePeriodo({ desde, hasta });
    setDraftStart(null);
    setHoveredMonth(null);
    setIsOpen(false);
  };

  const applyPreset = (desde: string, hasta: string) => {
    onChangePeriodo({ desde, hasta });
    setDraftStart(null);
    setHoveredMonth(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-wrap items-center gap-2 font-sans text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isEn ? "Select period range" : "Seleccionar rango de período"}
        className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-sans text-xs transition-colors ${
          isOpen
            ? "border-[#B8EE68]/60 bg-[#111E1B] text-[#EFF5ED]"
            : "border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/40"
        }`}
      >
        <CalendarRange className="h-3.5 w-3.5 text-[#B8EE68]" aria-hidden="true" />
        <span className="text-[#93A39C]">{isEn ? "Calendar range:" : "Rango del calendario:"}</span>
        <span className="font-mono font-medium text-[#EFF5ED]">
          {formatMonthLabel(effectiveMin, months)} → {formatMonthLabel(effectiveMax, months)}
        </span>
        {activeTotalMonths > 0 && (
          <span className="rounded bg-[#B8EE68]/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#B8EE68]">
            {durationBadge}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#93A39C] transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Atajos rápidos visibles en barra */}
      <div className="flex items-center gap-1" role="group" aria-label={isEn ? "Quick period presets" : "Atajos de período"}>
        {presets.map((p) => {
          const isActive = effectiveMin === p.desde && effectiveMax === p.hasta;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.desde, p.hasta)}
              aria-pressed={isActive}
              className={`rounded border px-2 py-1 font-mono text-[11px] font-medium transition-colors ${
                isActive
                  ? "border-[#B8EE68]/50 bg-[#B8EE68]/15 text-[#B8EE68]"
                  : "border-[#21312D] bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] hover:border-[#2A3F3A]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Popover calendario mensual */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={isEn ? "Month range calendar" : "Calendario de rango mensual"}
          className="absolute left-0 top-full z-40 mt-1.5 w-[300px] sm:w-[328px] rounded-xl border border-[#21312D] bg-[#0D1816] p-3 shadow-2xl"
        >
          {/* Guía de estado de selección */}
          <div className="mb-2.5 flex items-center justify-between border-b border-[#21312D] pb-2 text-[11px]">
            <span className={draftStart ? "font-medium text-[#B8EE68]" : "text-[#93A39C]"}>
              {draftStart
                ? isEn
                  ? `Start: ${formatMonthLabel(draftStart, months)} · Pick end month`
                  : `Inicio: ${formatMonthLabel(draftStart, months)} · Elegí el fin`
                : isEn
                  ? "Click a month to start range"
                  : "Hacé clic en un mes para iniciar"}
            </span>
            {draftStart && (
              <button
                type="button"
                onClick={() => {
                  setDraftStart(null);
                  setHoveredMonth(null);
                }}
                className="text-[#93A39C] underline hover:text-[#EFF5ED]"
              >
                {isEn ? "Cancel" : "Cancelar"}
              </button>
            )}
          </div>

          {/* Navegación rápida de año */}
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={viewYear <= minYear}
              onClick={() => setViewYear((y) => Math.max(minYear, y - 1))}
              aria-label={isEn ? "Previous year" : "Año anterior"}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <select
              aria-label={isEn ? "Year" : "Año"}
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="rounded border border-[#21312D] bg-[#111E1B] px-3 py-1 font-mono text-xs font-bold text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              aria-label={isEn ? "Next year" : "Año siguiente"}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Grilla 4x3 de meses */}
          <div className="grid grid-cols-4 gap-1.5">
            {months.map((label, idx) => {
              const ym = `${viewYear}-${String(idx + 1).padStart(2, "0")}`;
              const disabled = ym < mesMin || ym > mesMax;
              const isEdge = ym === rangeStart || ym === rangeEnd;
              const inRange = !disabled && ym >= rangeStart && ym <= rangeEnd;

              return (
                <button
                  key={ym}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleMonthClick(ym)}
                  onMouseEnter={() => {
                    if (draftStart && !disabled) setHoveredMonth(ym);
                  }}
                  aria-label={`${label} ${viewYear}`}
                  className={`rounded-md border py-1.5 font-mono text-xs font-medium transition-colors ${
                    disabled
                      ? "cursor-not-allowed border-transparent bg-[#07100F]/60 text-[#687771]/40"
                      : isEdge
                        ? "border-[#B8EE68] bg-[#B8EE68] font-bold text-[#07100F]"
                        : inRange
                          ? "border-[#B8EE68]/40 bg-[#B8EE68]/15 text-[#EFF5ED]"
                          : "border-[#21312D] bg-[#111E1B] text-[#93A39C] hover:border-[#B8EE68]/50 hover:text-[#EFF5ED]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
