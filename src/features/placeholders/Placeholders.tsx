import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Map as MapIcon, TrendingUp, Calendar, LineChart, Download } from 'lucide-react';

interface PlaceholderBoxProps {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  description: string;
  minHeight?: string;
}

export const PlaceholderBox: React.FC<PlaceholderBoxProps> = ({
  icon,
  title,
  badge,
  description,
  minHeight = 'min-h-[140px]',
}) => {
  return (
    <div
      className={`relative flex flex-col justify-between rounded-lg border border-dashed border-[#d9d8d3] bg-white p-4 shadow-sm transition-all ${minHeight}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#3987e5]">{icon}</span>
          <h3 className="text-sm font-semibold text-[#1f1f1d]">{title}</h3>
        </div>
        {badge && (
          <span className="rounded bg-[#f4f4f2] px-2 py-0.5 text-[11px] font-medium text-[#55554f]">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#55554f]">{description}</p>
    </div>
  );
};

export const ZonePlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderBox
      icon={<MapPin className="h-4 w-4" />}
      title="Selector de Zona"
      badge="P0"
      description={t('placeholders.zone')}
      minHeight="min-h-[85px]"
    />
  );
};

export const MapPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderBox
      icon={<MapIcon className="h-5 w-5" />}
      title="Mapa de Actividad (MapLibre)"
      badge="P0 / P1"
      description={t('placeholders.map')}
      minHeight="min-h-[320px]"
    />
  );
};

export const AnomalyPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderBox
      icon={<TrendingUp className="h-4 w-4" />}
      title="Anomalía del Mes en Curso"
      badge="P1"
      description={t('placeholders.anomaly')}
      minHeight="min-h-[95px]"
    />
  );
};

export const CalendarPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-[#e2e2df] bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#3987e5]" />
          <h2 className="text-base font-bold text-[#1f1f1d]">Calendario Armonizado mes × año</h2>
        </div>
        <span className="rounded bg-[#cde2fb] px-2 py-0.5 text-xs font-semibold text-[#0d366b]">
          2000 → hoy
        </span>
      </div>
      <p className="text-xs text-[#55554f]">{t('placeholders.calendar')}</p>
      <div className="mt-3 flex h-48 items-center justify-center rounded border border-dashed border-[#d9d8d3] bg-[#fcfcfb] pattern-estimado">
        <span className="rounded bg-white/90 px-3 py-1 text-xs font-medium text-[#1f1f1d] shadow-sm">
          Matriz 2000–2026 (W3: CalendarHeatmap)
        </span>
      </div>
    </div>
  );
};

export const SeriesPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderBox
      icon={<LineChart className="h-4 w-4" />}
      title="Serie Temporal (Anual / Mensual)"
      badge="P1"
      description={t('placeholders.series')}
      minHeight="min-h-[140px]"
    />
  );
};

export const DownloadsPlaceholder: React.FC = () => {
  const { t } = useTranslation();
  return (
    <PlaceholderBox
      icon={<Download className="h-4 w-4" />}
      title="Descargas CSV"
      badge="P0"
      description={t('placeholders.downloads')}
      minHeight="min-h-[75px]"
    />
  );
};
