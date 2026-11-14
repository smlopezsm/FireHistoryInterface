import React from 'react';
import { SATELLITE_LIST, type SatelliteData } from '../../data/satellites';
import { Radio } from 'lucide-react';

interface SatelliteSelectorProps {
  selectedId: 'terra' | 'aqua' | 'suomi';
  onSelect: (id: 'terra' | 'aqua' | 'suomi') => void;
}

export const SatelliteSelector: React.FC<SatelliteSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Seleccionar satélite para visualización 3D"
      className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-900/80 p-1.5 backdrop-blur-md border border-slate-700/60"
    >
      {SATELLITE_LIST.map((satellite: SatelliteData) => {
        const isSelected = satellite.id === selectedId;
        const isViirs = satellite.instrument === 'VIIRS';

        return (
          <button
            key={satellite.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(satellite.id)}
            className={`group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isSelected
                ? 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 text-white shadow-md border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
            }`}
          >
            <Radio
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isSelected ? 'scale-110 text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
              }`}
            />
            <span>{satellite.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                isViirs
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {satellite.instrument}
            </span>
          </button>
        );
      })}
    </div>
  );
};
