import React from "react";
import type { SatelliteData } from "../../data/satellites";
import { ExternalLink, Compass, ShieldCheck, Flame, Cpu } from "lucide-react";

interface SatelliteInfoProps {
  satellite: SatelliteData;
}

export const SatelliteInfo: React.FC<SatelliteInfoProps> = ({ satellite }) => {
  const isViirs = satellite.instrument === "VIIRS";

  return (
    <div className="flex flex-col gap-4 text-[#EFF5ED]">
      {/* Encabezado del satélite */}
      <div className="flex items-start justify-between gap-3 border-b border-[#21312D] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-title font-bold tracking-tight text-[#EFF5ED]">
              {satellite.fullName}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${
                isViirs
                  ? "border border-[#FF9C55]/40 bg-[#FF9C55]/15 text-[#FF9C55]"
                  : "border border-[#68D9D0]/40 bg-[#68D9D0]/15 text-[#68D9D0]"
              }`}
            >
              {satellite.instrument}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-sans text-[#93A39C]">
            {satellite.agency}
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-[#B8EE68]/40 bg-[#B8EE68]/15 px-2.5 py-1 font-mono text-xs font-medium text-[#B8EE68]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{satellite.status}</span>
        </div>
      </div>

      {/* Resumen */}
      <p className="text-xs font-sans leading-relaxed text-[#93A39C]">
        {satellite.summary}
      </p>

      {/* Rol en detección de focos de calor (NASA Space Apps) */}
      <div className="rounded-lg border border-[#21312D] bg-[#111E1B] p-3">
        <div className="flex items-center gap-1.5 text-xs font-sans font-semibold text-[#EFF5ED]">
          <Flame className="h-4 w-4 text-[#FF6759]" />
          <span>Rol en Focos de Calor e Incendios:</span>
        </div>
        <p className="mt-1.5 text-xs font-sans leading-relaxed text-[#93A39C]">
          {satellite.hotspotsRole}
        </p>
      </div>

      {/* Métricas y Órbita */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col rounded-lg border border-[#21312D] bg-[#111E1B] p-2.5">
          <div className="flex items-center gap-1 text-xs text-[#93A39C]">
            <Cpu className="h-3 w-3 text-[#68D9D0]" />
            <span>Instrumento</span>
          </div>
          <span className="mt-1 font-mono text-xs font-bold text-[#EFF5ED]">
            {satellite.instrument}
          </span>
          <span className="text-xs text-[#93A39C]">
            {satellite.instrumentFullName}
          </span>
        </div>

        <div className="flex flex-col rounded-lg border border-[#21312D] bg-[#111E1B] p-2.5">
          <div className="flex items-center gap-1 text-xs text-[#93A39C]">
            <Compass className="h-3 w-3 text-[#B8EE68]" />
            <span>Órbita & Altitud</span>
          </div>
          <span className="mt-1 font-mono text-xs font-bold text-[#EFF5ED]">
            {satellite.altitude}
          </span>
          <span className="text-xs text-[#93A39C]">
            {satellite.equatorCrossing}
          </span>
        </div>
      </div>

      {/* Tags y Enlace oficial NASA */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#21312D] pt-3">
        <div className="flex flex-wrap gap-1.5">
          {satellite.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#21312D] bg-[#111E1B] px-2.5 py-0.5 text-xs font-mono text-[#93A39C]"
            >
              #{tag}
            </span>
          ))}
        </div>

        <a
          href={satellite.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[#B8EE68] transition-colors hover:text-[#CBF58C] hover:underline"
        >
          <span>Modelo oficial NASA</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
