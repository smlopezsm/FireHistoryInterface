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
      className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#07100F] p-1 border border-[#21312D]"
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
            className={`group relative flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#B8EE68] ${
              isSelected
                ? 'bg-[#111E1B] text-[#EFF5ED] border border-[#B8EE68]'
                : 'text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] border border-transparent'
            }`}
          >
            <Radio
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isSelected ? 'scale-110 text-[#B8EE68]' : 'text-[#687771] group-hover:text-[#93A39C]'
              }`}
            />
            <span>{satellite.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-mono font-bold tracking-wide uppercase ${
                isViirs
                  ? 'bg-[#FF9C55]/15 text-[#FF9C55] border border-[#FF9C55]/40'
                  : 'bg-[#68D9D0]/15 text-[#68D9D0] border border-[#68D9D0]/40'
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
