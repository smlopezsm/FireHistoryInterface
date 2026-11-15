import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Pentagon, Compass, Crosshair } from "lucide-react";
import { useProvincias } from "../../api";

export interface ZoneItem {
  id: string;
  name: string;
  region: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  provincia_id?: string;
  bbox?: [number, number, number, number];
}

export const PROVINCIAS_ARG: ZoneItem[] = [
  {
    id: "arg",
    name: "Argentina (Completa)",
    region: "Nacional",
    center: [-64, -38],
    zoom: 2.2,
    bbox: [-73.6, -55.1, -53.6, -21.8],
  },
  {
    id: "cordoba",
    name: "Córdoba",
    region: "Centro / Sierras",
    center: [-64.2, -31.4],
    zoom: 5.5,
    provincia_id: "14",
    bbox: [-65.8, -35.0, -61.7, -29.5],
  },
  {
    id: "san-luis",
    name: "San Luis",
    region: "Cuyo",
    center: [-66.3, -33.3],
    zoom: 5.5,
    provincia_id: "74",
    bbox: [-67.4, -36.0, -64.9, -31.8],
  },
  {
    id: "corrientes",
    name: "Corrientes (Esteros del Iberá)",
    region: "Litoral",
    center: [-58.8, -28.5],
    zoom: 5.5,
    provincia_id: "18",
    bbox: [-59.7, -30.7, -55.6, -27.2],
  },
  {
    id: "entre-rios",
    name: "Entre Ríos (Delta del Paraná)",
    region: "Litoral",
    center: [-59.8, -32.0],
    zoom: 5.5,
    provincia_id: "30",
    bbox: [-60.8, -34.0, -57.8, -30.1],
  },
  {
    id: "salta",
    name: "Salta (Yungas / Chaco)",
    region: "NOA",
    center: [-65.4, -24.8],
    zoom: 5.2,
    provincia_id: "66",
    bbox: [-68.6, -26.4, -62.3, -22.0],
  },
  {
    id: "chubut",
    name: "Chubut (Bosque Andino Patagónico)",
    region: "Patagonia",
    center: [-68.5, -43.8],
    zoom: 4.8,
    provincia_id: "26",
    bbox: [-72.2, -46.1, -65.0, -42.0],
  },
  {
    id: "la-pampa",
    name: "La Pampa (Caldenal)",
    region: "Pampeana",
    center: [-65.3, -37.2],
    zoom: 5.0,
    provincia_id: "42",
    bbox: [-68.3, -39.0, -63.4, -35.0],
  },
];

interface ZoneSelectorWidgetProps {
  selectedZone: ZoneItem;
  onSelectZone: (zone: ZoneItem) => void;
  capa: "armonizado" | "modis" | "viirs";
  onChangeCapa: (capa: "armonizado" | "modis" | "viirs") => void;
  className?: string;
}

export const ZoneSelectorWidget: React.FC<ZoneSelectorWidgetProps> = ({
  selectedZone,
  onSelectZone,
  capa,
  onChangeCapa,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith("es"));
  const [showCoordinates, setShowCoordinates] = useState(false);
  const { data: apiProvincias } = useProvincias();

  const zonesList: ZoneItem[] = useMemo(() => {
    if (!apiProvincias || apiProvincias.length === 0) {
      return PROVINCIAS_ARG;
    }

    const nationalZone: ZoneItem = {
      id: "arg",
      name: isEn ? t("zone.allCountry") : "Argentina (Completa)",
      region: isEn ? t("zone.national") : "Nacional",
      center: [-64, -38],
      zoom: 2.2,
      bbox: [-73.6, -55.1, -53.6, -21.8],
    };

    const provZones: ZoneItem[] = apiProvincias.map((p) => {
      const lng = Number(((p.bbox[0] + p.bbox[2]) / 2).toFixed(2));
      const lat = Number(((p.bbox[1] + p.bbox[3]) / 2).toFixed(2));
      return {
        id: p.provincia_id,
        provincia_id: p.provincia_id,
        name: p.nombre,
        region: p.region,
        center: [lng, lat],
        zoom: 5.5,
        bbox: p.bbox,
      };
    });

    return [nationalZone, ...provZones];
  }, [apiProvincias, isEn, t]);

  const [lng, lat] = selectedZone.center;
  const latFormatted = `${Math.abs(lat).toFixed(2)}° ${lat < 0 ? "S" : "N"}`;
  const lngFormatted = `${Math.abs(lng).toFixed(2)}° ${lng < 0 ? "W" : "E"}`;

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

        {/* Herramientas de visualización geoespacial */}
        <div className="flex items-center gap-1 font-sans text-xs">
          <button
            type="button"
            onClick={() => setShowCoordinates(false)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              !showCoordinates
                ? "bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40"
                : "bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]"
            }`}
          >
            <span>{t("zone.province")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCoordinates((prev) => !prev)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              showCoordinates
                ? "bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40"
                : "bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]"
            }`}
            title="Inspect nadir coordinates"
          >
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("zone.latlon")}</span>
          </button>

          <span
            className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#111E1B] text-[#687771] border border-[#21312D] px-2 py-1 font-mono text-xs"
            title="IGN Argentina official polygon extents loaded"
          >
            <Pentagon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>GeoJSON</span>
          </span>
        </div>
      </div>

      {/* Selector de territorio y selector maestro de capas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-0.5">
        {/* Desplegable de jurisdicción */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="province-select"
              className="font-sans text-xs font-medium text-[#93A39C]"
            >
              {t("zone.territoryLabel")}
            </label>
            <span className="font-mono tabular-nums text-xs text-[#B8EE68] flex items-center gap-1">
              <Crosshair className="h-3 w-3" />
              <span>{latFormatted}</span>
            </span>
          </div>
          <select
            id="province-select"
            value={selectedZone.id}
            onChange={(e) => {
              const found = zonesList.find((z) => z.id === e.target.value || z.provincia_id === e.target.value);
              if (found) onSelectZone(found);
            }}
            className="w-full rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-2 font-sans text-xs font-medium text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none transition-colors"
          >
            {zonesList.map((z) => {
              const displayName =
                z.id === "arg" && isEn ? t("zone.allCountry") : z.name;
              const displayRegion =
                z.id === "arg" && isEn ? t("zone.national") : z.region;
              return (
                <option key={z.id} value={z.id}>
                  {displayName} — {displayRegion}
                </option>
              );
            })}
          </select>
        </div>

        {/* Conmutador maestro de sensor (Armonizado / MODIS / VIIRS) */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-sans text-xs font-medium text-[#93A39C]">
              {t("zone.sensorScale")}
            </label>
            <span className="font-mono tabular-nums text-xs text-[#93A39C]">
              {lngFormatted}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-md border border-[#21312D] bg-[#111E1B] p-1 font-sans text-xs">
            <button
              type="button"
              onClick={() => onChangeCapa("armonizado")}
              className={`rounded py-1.5 font-semibold transition-all text-center ${
                capa === "armonizado"
                  ? "bg-[#B8EE68] text-[#07100F]"
                  : "text-[#93A39C] hover:text-[#EFF5ED]"
              }`}
            >
              {t("zone.harmonized")}
            </button>
            <button
              type="button"
              onClick={() => onChangeCapa("modis")}
              className={`rounded py-1.5 font-semibold transition-all text-center ${
                capa === "modis"
                  ? "bg-[#68D9D0] text-[#07100F]"
                  : "text-[#93A39C] hover:text-[#EFF5ED]"
              }`}
            >
              MODIS
            </button>
            <button
              type="button"
              onClick={() => onChangeCapa("viirs")}
              className={`rounded py-1.5 font-semibold transition-all text-center ${
                capa === "viirs"
                  ? "bg-[#FF9C55] text-[#07100F]"
                  : "text-[#93A39C] hover:text-[#EFF5ED]"
              }`}
            >
              VIIRS
            </button>
          </div>
        </div>
      </div>

      {/* Telemetría ampliada opcional de coordenadas de nadir */}
      {showCoordinates && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#21312D] bg-[#07100F] px-3 py-2 font-mono text-xs text-[#93A39C]">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-[#EFF5ED]">NADIR:</strong> {latFormatted},{" "}
              {lngFormatted}
            </span>
            <span>
              <strong className="text-[#EFF5ED]">ZOOM:</strong>{" "}
              {selectedZone.zoom.toFixed(1)}x
            </span>
            <span>
              <strong className="text-[#EFF5ED]">REF:</strong> IGN WGS84
            </span>
          </div>
          <span className="text-[#68D9D0]">
            {capa === "armonizado"
              ? "Escala S-NPP Equivalente"
              : capa === "modis"
                ? "MODIS 1 km (Terra/Aqua)"
                : "VIIRS 375 m (Suomi NPP)"}
          </span>
        </div>
      )}
    </div>
  );
};
