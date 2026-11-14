import React from 'react';
import { MapPin, Pentagon, Compass } from 'lucide-react';

export interface ZoneItem {
  id: string;
  name: string;
  region: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export const PROVINCIAS_ARG: ZoneItem[] = [
  { id: 'arg', name: 'Argentina (Completa)', region: 'Nacional', center: [-64, -38], zoom: 2.2 },
  { id: 'cordoba', name: 'Córdoba', region: 'Centro / Sierras', center: [-64.2, -31.4], zoom: 5.5 },
  { id: 'san-luis', name: 'San Luis', region: 'Cuyo', center: [-66.3, -33.3], zoom: 5.5 },
  { id: 'corrientes', name: 'Corrientes (Esteros del Iberá)', region: 'Litoral', center: [-58.8, -28.5], zoom: 5.5 },
  { id: 'entre-rios', name: 'Entre Ríos (Delta del Paraná)', region: 'Litoral', center: [-59.8, -32.0], zoom: 5.5 },
  { id: 'salta', name: 'Salta (Yungas / Chaco)', region: 'NOA', center: [-65.4, -24.8], zoom: 5.2 },
  { id: 'chubut', name: 'Chubut (Bosque Andino Patagónico)', region: 'Patagonia', center: [-68.5, -43.8], zoom: 4.8 },
  { id: 'la-pampa', name: 'La Pampa (Caldenal)', region: 'Pampeana', center: [-65.3, -37.2], zoom: 5.0 },
];

interface ZoneSelectorWidgetProps {
  selectedZone: ZoneItem;
  onSelectZone: (zone: ZoneItem) => void;
  capa: 'armonizado' | 'modis' | 'viirs';
  onChangeCapa: (capa: 'armonizado' | 'modis' | 'viirs') => void;
}

export const ZoneSelectorWidget: React.FC<ZoneSelectorWidgetProps> = ({
  selectedZone,
  onSelectZone,
  capa,
  onChangeCapa,
}) => {
  return (
    <div
      role="region"
      aria-label="Selector de zona geográfica y sensor"
      className="flex flex-col gap-3 rounded-xl border border-[#21312D] bg-[#0D1816] p-4 text-[#EFF5ED]"
    >
      {/* Selector de Región / Provincia y Modos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#B8EE68]" />
          <span className="font-title text-sm font-bold text-[#EFF5ED]">Selección de Área</span>
          <span className="font-mono text-[10px] text-[#93A39C] rounded bg-[#111E1B] border border-[#21312D] px-1.5 py-0.5">
            IGN Oficial
          </span>
        </div>

        {/* Modos de entrada (Provincia / Polígono / Lat-Lon) */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40 px-2 py-0.5 font-bold"
          >
            <span>Provincia</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D] px-2 py-0.5"
            title="Herramienta de dibujo de polígono (Terra Draw)"
          >
            <Pentagon className="h-3 w-3" />
            <span>Dibujar</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D] px-2 py-0.5"
            title="Ingreso manual de coordenadas"
          >
            <Compass className="h-3 w-3" />
            <span>Lat/Lon</span>
          </button>
        </div>
      </div>

      {/* Select de provincias y selector de capas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Desplegable de provincia */}
        <div>
          <label htmlFor="province-select" className="block font-mono text-[11px] text-[#93A39C] mb-1">
            Jurisdicción o Territorio:
          </label>
          <select
            id="province-select"
            value={selectedZone.id}
            onChange={(e) => {
              const found = PROVINCIAS_ARG.find((z) => z.id === e.target.value);
              if (found) onSelectZone(found);
            }}
            className="w-full rounded-lg border border-[#21312D] bg-[#111E1B] px-3 py-2 font-mono text-xs text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none"
          >
            {PROVINCIAS_ARG.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} — {z.region}
              </option>
            ))}
          </select>
        </div>

        {/* Conmutador de sensor (Armonizado / MODIS / VIIRS) */}
        <div>
          <label className="block font-mono text-[11px] text-[#93A39C] mb-1">
            Sensor / Escala de Análisis:
          </label>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#21312D] bg-[#111E1B] p-1 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => onChangeCapa('armonizado')}
              className={`rounded py-1 font-semibold transition-all ${
                capa === 'armonizado'
                  ? 'bg-[#B8EE68] text-[#07100F] shadow-sm'
                  : 'text-[#93A39C] hover:text-[#EFF5ED]'
              }`}
            >
              Armonizado
            </button>
            <button
              type="button"
              onClick={() => onChangeCapa('modis')}
              className={`rounded py-1 font-semibold transition-all ${
                capa === 'modis'
                  ? 'bg-[#68D9D0] text-[#07100F] shadow-sm'
                  : 'text-[#93A39C] hover:text-[#EFF5ED]'
              }`}
            >
              MODIS
            </button>
            <button
              type="button"
              onClick={() => onChangeCapa('viirs')}
              className={`rounded py-1 font-semibold transition-all ${
                capa === 'viirs'
                  ? 'bg-[#FF9C55] text-[#07100F] shadow-sm'
                  : 'text-[#93A39C] hover:text-[#EFF5ED]'
              }`}
            >
              VIIRS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
