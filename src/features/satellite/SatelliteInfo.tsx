import React from 'react';
import type { SatelliteData } from '../../data/satellites';
import { ExternalLink, Compass, ShieldCheck, Flame, Cpu } from 'lucide-react';

interface SatelliteInfoProps {
  satellite: SatelliteData;
}

export const SatelliteInfo: React.FC<SatelliteInfoProps> = ({ satellite }) => {
  const isViirs = satellite.instrument === 'VIIRS';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/85 p-5 text-slate-200 shadow-2xl backdrop-blur-md">
      {/* Encabezado del satélite */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">
              {satellite.fullName}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                isViirs
                  ? 'border border-orange-500/40 bg-orange-500/20 text-orange-300'
                  : 'border border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
              }`}
            >
              {satellite.instrument}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{satellite.agency}</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{satellite.status}</span>
        </div>
      </div>

      {/* Resumen */}
      <p className="text-xs leading-relaxed text-slate-300">
        {satellite.summary}
      </p>

      {/* Rol en detección de focos de calor (NASA Space Apps) */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
          <Flame className="h-4 w-4" />
          <span>Rol en Focos de Calor e Incendios:</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {satellite.hotspotsRole}
        </p>
      </div>

      {/* Métricas y Órbita */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Cpu className="h-3 w-3 text-cyan-400" />
            <span>Instrumento</span>
          </div>
          <span className="mt-1 font-semibold text-white">{satellite.instrument}</span>
          <span className="text-[10px] text-slate-400">{satellite.instrumentFullName}</span>
        </div>

        <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/40 p-2.5">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Compass className="h-3 w-3 text-cyan-400" />
            <span>Órbita & Altitud</span>
          </div>
          <span className="mt-1 font-semibold text-white">{satellite.altitude}</span>
          <span className="text-[10px] text-slate-400">{satellite.equatorCrossing}</span>
        </div>
      </div>

      {/* Tags y Enlace oficial NASA */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {satellite.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        <a
          href={satellite.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300 hover:underline"
        >
          <span>Modelo oficial NASA</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
