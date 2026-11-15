import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Pentagon, Compass, Crosshair, Loader2, AlertCircle, CalendarRange } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProvincias,
  getProvincias,
  regionesDe,
  zonaDeRegion,
  esZonaRegion,
  zoomParaBbox,
  zonaDeBbox,
  ZONA_ARGENTINA,
  type Capa,
  type ZonaSeleccionada,
} from "../../api";
import { CoordinateForm } from "./CoordinateForm";

/** @deprecated usar ZonaSeleccionada */
export type ZoneItem = ZonaSeleccionada;

export interface Periodo {
  desde: string; // YYYY-MM
  hasta: string; // YYYY-MM
}

interface ZoneSelectorWidgetProps {
  selectedZone: ZonaSeleccionada;
  onSelectZone: (zone: ZonaSeleccionada) => void;
  capa: Capa;
  onChangeCapa: (capa: Capa) => void;
  periodo: Periodo;
  onChangePeriodo: (periodo: Periodo) => void;
  /** Límites del período según /metadata (YYYY-MM). */
  mesMin?: string;
  mesMax?: string;
  className?: string;
}

export const ZoneSelectorWidget: React.FC<ZoneSelectorWidgetProps> = ({
  selectedZone,
  onSelectZone,
  capa,
  onChangeCapa,
  periodo,
  onChangePeriodo,
  mesMin,
  mesMax,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith("es"));
  const [showCoordinates, setShowCoordinates] = useState(false);
  const { data: apiProvincias, isLoading, error } = useProvincias();

  // Lista de zonas: Argentina completa (bbox), las 24 provincias de /provincias
  // y, si existe, el polígono que el usuario dibujó en el mapa.
  const zonesList: ZonaSeleccionada[] = useMemo(() => {
    const provZones: ZonaSeleccionada[] = (apiProvincias ?? []).map((p) => ({
      id: p.provincia_id,
      provincia_id: p.provincia_id,
      nombre: p.nombre,
      region: p.region,
      center: [(p.bbox[0] + p.bbox[2]) / 2, (p.bbox[1] + p.bbox[3]) / 2],
      zoom: zoomParaBbox(p.bbox),
      bbox: p.bbox,
    }));
    // Orden alfabético (la API las devuelve por código INDEC)
    provZones.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return [ZONA_ARGENTINA, ...provZones];
  }, [apiProvincias]);

  const queryClient = useQueryClient();
  const regiones = useMemo(() => regionesDe(apiProvincias ?? []), [apiProvincias]);
  const regionActual = selectedZone.provincia_id || esZonaRegion(selectedZone) ? selectedZone.region : "";
  const zonaPropia =
    selectedZone.id !== ZONA_ARGENTINA.id && !selectedZone.provincia_id && !esZonaRegion(selectedZone) ? selectedZone : null;
  const [cargandoRegion, setCargandoRegion] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  // Región completa: se consulta como polígono (unión de sus provincias)
  const elegirRegion = async (region: string) => {
    setRegionError(null);
    if (!region) return onSelectZone(ZONA_ARGENTINA);
    setCargandoRegion(true);
    try {
      const conGeometria = await queryClient.fetchQuery({
        queryKey: ["provincias", { geometria: true }],
        queryFn: ({ signal }) => getProvincias(true, signal),
        staleTime: Infinity,
      });
      onSelectZone(await zonaDeRegion(conGeometria, region));
    } catch (err) {
      setRegionError(err instanceof Error ? err.message : String(err));
    } finally {
      setCargandoRegion(false);
    }
  };

  const selectCls =
    "w-full rounded-md border border-[#21312D] bg-[#111E1B] px-2.5 py-2 font-sans text-xs font-medium text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none transition-colors disabled:opacity-60";

  const zoneLabel = (z: ZonaSeleccionada) => {
    if (z.id === ZONA_ARGENTINA.id) return `${t("zone.allCountry")} — ${t("zone.national")}`;
    if (z.geometria) return isEn ? "Drawn area — polygon" : "Zona dibujada — polígono";
    if (!z.provincia_id && z.bbox) return `${z.nombre} — ${z.bbox.map((n) => n.toFixed(2)).join(", ")}`;
    return `${z.nombre} — ${z.region}`;
  };

  const [lng, lat] = selectedZone.center;
  const latFormatted = `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? "S" : "N"}`;
  const lngFormatted = `${Math.abs(lng).toFixed(2)}° ${lng < 0 ? "W" : "E"}`;

  const setDesde = (v: string) => {
    if (!v) return;
    onChangePeriodo({ desde: v, hasta: v > periodo.hasta ? v : periodo.hasta });
  };
  const setHasta = (v: string) => {
    if (!v) return;
    onChangePeriodo({ desde: v < periodo.desde ? v : periodo.desde, hasta: v });
  };

  return (
    <div
      role="region"
      aria-label={t("zone.title")}
      className={`flex flex-col gap-3 bg-[#0D1816] p-4 text-[#EFF5ED] ${className}`.trim()}
    >
      {/* Barra superior de telemetría territorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21312D]/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[#B8EE68]/40 bg-[#B8EE68]/10 text-[#B8EE68]">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="font-title text-sm font-bold text-[#EFF5ED]">
            {t("zone.title")}
          </span>
          <span className="rounded bg-[#111E1B] border border-[#21312D] px-2 py-0.5 font-mono text-xs text-[#93A39C]">
            {t("zone.ignBadge")}
          </span>
        </div>

        <div className="flex items-center gap-1 font-sans text-xs">
          <button
            type="button"
            onClick={() => setShowCoordinates((prev) => !prev)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              showCoordinates
                ? "bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40"
                : "bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]"
            }`}
            aria-pressed={showCoordinates}
            aria-expanded={showCoordinates}
            title={isEn ? "Enter coordinates or a bounding box" : "Ingresar coordenadas o un rectángulo"}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("zone.latlon")}</span>
          </button>

          <span
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#111E1B] text-[#687771] border border-[#21312D] px-2 py-1 font-mono text-xs"
            title={isEn ? "Draw a polygon on the map to query a custom area" : "Dibujá un polígono en el mapa para consultar una zona propia"}
          >
            <Pentagon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{selectedZone.geometria ? (isEn ? "Polygon" : "Polígono") : "GeoJSON"}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-0.5">
        {/* Región y provincia */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#93A39C]">{t("zone.territoryLabel")}</span>
            <span className="font-mono tabular-nums text-xs text-[#B8EE68] flex items-center gap-1">
              {isLoading || cargandoRegion ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crosshair className="h-3 w-3" />}
              <span>{latFormatted}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <label className="sr-only" htmlFor="region-select">{isEn ? "Region" : "Región"}</label>
            <select
              id="region-select"
              value={regionActual}
              disabled={cargandoRegion || regiones.length === 0}
              onChange={(e) => elegirRegion(e.target.value)}
              className={selectCls}
            >
              <option value="">{isEn ? "All regions" : "Todas las regiones"}</option>
              {regiones.map((r) => (
                <option key={r} value={r}>
                  {isEn ? `Region ${r}` : `Región ${r}`}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="province-select">{isEn ? "Province" : "Provincia"}</label>
            <select
              id="province-select"
              value={selectedZone.id}
              disabled={cargandoRegion}
              onChange={(e) => {
                const v = e.target.value;
                if (v.startsWith("region-")) return elegirRegion(v.slice("region-".length));
                const found = zonesList.find((z) => z.id === v);
                if (found) onSelectZone(found);
              }}
              className={selectCls}
            >
              {regionActual ? (
                <option value={`region-${regionActual}`}>
                  {isEn ? "Whole region" : "Toda la región"}
                </option>
              ) : (
                <option value={ZONA_ARGENTINA.id}>{t("zone.allCountry")}</option>
              )}
              {zonesList
                .filter((z) => z.provincia_id && (!regionActual || z.region === regionActual))
                .map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              {zonaPropia && <option value={zonaPropia.id}>{zoneLabel(zonaPropia)}</option>}
            </select>
          </div>
          {esZonaRegion(selectedZone) && (
            <span className="text-xs text-[#687771]">
              {isEn
                ? "Region = union of its provinces' outlines; may differ 1–5 % from the sum by province."
                : "Región = unión de los contornos de sus provincias; puede diferir 1–5 % de la suma por provincia."}
            </span>
          )}
          {(error || regionError) && (
            <span role="alert" className="flex items-center gap-1 text-xs text-[#FF9C55]">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {regionError ?? error?.message}
            </span>
          )}
        </div>

        {/* Conmutador maestro de sensor (Armonizado / MODIS / VIIRS) */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-medium text-[#93A39C]">{t("zone.sensorScale")}</span>
            <span className="font-mono tabular-nums text-xs text-[#93A39C]">{lngFormatted}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-[#21312D] bg-[#111E1B] p-1 font-sans text-xs">
            {([
              ["armonizado", t("zone.harmonized"), "bg-[#B8EE68]"],
              ["modis", "MODIS", "bg-[#68D9D0]"],
              ["viirs", "VIIRS", "bg-[#FF9C55]"],
            ] as const).map(([value, label, activeBg]) => (
              <button
                key={value}
                type="button"
                onClick={() => onChangeCapa(value)}
                aria-pressed={capa === value}
                className={`rounded py-1.5 font-semibold transition-all text-center ${
                  capa === value ? `${activeBg} text-[#07100F]` : "text-[#93A39C] hover:text-[#EFF5ED]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Período del calendario y la serie (YYYY-MM) */}
        <div className="md:col-span-12 flex flex-wrap items-center gap-2 font-sans text-xs">
          <CalendarRange className="h-3.5 w-3.5 text-[#93A39C]" aria-hidden="true" />
          <span className="font-medium text-[#93A39C]">{isEn ? "Period" : "Período"}</span>
          <label className="flex items-center gap-1 text-[#93A39C]">
            <span>{isEn ? "from" : "desde"}</span>
            <input
              type="month"
              value={periodo.desde}
              min={mesMin}
              max={mesMax}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 font-mono text-xs text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none [color-scheme:dark]"
            />
          </label>
          <label className="flex items-center gap-1 text-[#93A39C]">
            <span>{isEn ? "to" : "hasta"}</span>
            <input
              type="month"
              value={periodo.hasta}
              min={mesMin}
              max={mesMax}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 font-mono text-xs text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none [color-scheme:dark]"
            />
          </label>
          {mesMin && mesMax && (periodo.desde !== mesMin || periodo.hasta !== mesMax) && (
            <button
              type="button"
              onClick={() => onChangePeriodo({ desde: mesMin, hasta: mesMax })}
              className="rounded-md border border-[#21312D] bg-[#111E1B] px-2 py-1 text-[#93A39C] hover:text-[#EFF5ED]"
            >
              {isEn ? "Full range" : "Todo el registro"}
            </button>
          )}
        </div>
      </div>

      {showCoordinates && (
        <CoordinateForm
          isEn={isEn}
          selectedZone={selectedZone}
          onApply={(bbox, porPunto) =>
            onSelectZone(
              zonaDeBbox(
                bbox,
                porPunto ? (isEn ? "Point and radius" : "Punto y radio") : isEn ? "Rectangle" : "Rectángulo",
                "lat/lon",
              ),
            )
          }
        />
      )}

      {showCoordinates && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#21312D] bg-[#07100F] px-3 py-2 font-mono text-xs text-[#93A39C]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              <strong className="text-[#EFF5ED]">{isEn ? "CENTER:" : "CENTRO:"}</strong> {latFormatted}, {lngFormatted}
            </span>
            {selectedZone.bbox && (
              <span>
                <strong className="text-[#EFF5ED]">BBOX:</strong> {selectedZone.bbox.map((n) => n.toFixed(2)).join(", ")}
              </span>
            )}
          </div>
          <span className="text-[#68D9D0]">
            {capa === "armonizado"
              ? isEn ? "S-NPP equivalent scale" : "Escala S-NPP equivalente"
              : capa === "modis"
                ? "MODIS 1 km (Terra/Aqua)"
                : "VIIRS 375 m (Suomi NPP)"}
          </span>
        </div>
      )}
    </div>
  );
};
