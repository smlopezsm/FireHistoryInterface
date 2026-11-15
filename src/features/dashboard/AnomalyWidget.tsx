import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AnomaliaResponse } from '../../api/types';
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

interface AnomalyWidgetProps {
  zonaNombre: string;
  data?: AnomaliaResponse;
  isLoading?: boolean;
  error?: Error | null;
  /** El mes es posterior a fecha_ultimo_sp (datos NRT que pueden cambiar). */
  preliminar?: boolean;
  className?: string;
}

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const AnomalyWidget: React.FC<AnomalyWidgetProps> = ({
  zonaNombre,
  data,
  isLoading = false,
  error = null,
  preliminar = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isEs = Boolean(i18n?.language?.startsWith('es'));
  const locale = isEs ? 'es-AR' : 'en-US';
  const sinDato = isEs ? 'sin dato' : 'no data';

  const mes = (() => {
    if (!data) return '';
    const [y, m] = data.mes.split('-');
    const nombre = (isEs ? MESES_ES : MESES_EN)[parseInt(m, 10) - 1] ?? m;
    return `${nombre} ${y}`;
  })();

  const fmt = (v: number | null | undefined) =>
    v === null || v === undefined ? sinDato : Math.round(v).toLocaleString(locale);

  const categoria = data?.categoria ?? null;
  const referenceLabel = data?.referencia === 'observada' ? t('anomaly.referenceObserved')
    : data?.referencia === 'estimada' ? t('anomaly.referenceEstimated') : null;

  const getCategoryConfig = () => {
    switch (categoria) {
      case 'muy_por_encima':
        return { title: t('anomaly.criticalTitle', { month: mes }), badge: t('anomaly.criticalBadge'), color: '#FF6759', bg: 'bg-[#FF6759]/10', icon: <TrendingUp className="h-5 w-5 text-[#FF6759]" /> };
      case 'por_encima':
        return { title: t('anomaly.elevatedTitle', { month: mes }), badge: t('anomaly.elevatedBadge'), color: '#FF9C55', bg: 'bg-[#FF9C55]/10', icon: <TrendingUp className="h-5 w-5 text-[#FF9C55]" /> };
      case 'normal':
        return { title: t('anomaly.normalTitle', { month: mes }), badge: t('anomaly.normalBadge'), color: '#93A39C', bg: 'bg-[#93A39C]/10', icon: <Minus className="h-5 w-5 text-[#93A39C]" /> };
      case 'por_debajo':
        return { title: t('anomaly.lowTitle', { month: mes }), badge: t('anomaly.lowBadge'), color: '#68D9D0', bg: 'bg-[#68D9D0]/10', icon: <TrendingDown className="h-5 w-5 text-[#68D9D0]" /> };
      case 'muy_por_debajo':
        return { title: t('anomaly.minimumTitle', { month: mes }), badge: t('anomaly.minimumBadge'), color: '#4FA89B', bg: 'bg-[#4FA89B]/10', icon: <TrendingDown className="h-5 w-5 text-[#4FA89B]" /> };
      default:
        // categoria null: menos de 10 años de historia o mes incompleto
        return { title: data ? t('anomaly.noDataTitle') : '', badge: t('anomaly.noDataBadge'), color: '#93A39C', bg: 'bg-[#111E1B]', icon: <AlertCircle className="h-5 w-5 text-[#93A39C]" /> };
    }
  };

  const config = getCategoryConfig();
  // razon = valor / mediana; null si la mediana es 0
  const delta = data?.razon !== null && data?.razon !== undefined ? Math.round((data.razon - 1) * 100) : null;
  const deltaFormatted = delta === null ? null : delta > 0 ? `+${delta}%` : `${delta}%`;

  return (
    <div role="region" aria-label={t('anomaly.label')} aria-busy={isLoading} className={`p-5 transition-all duration-300 ${config.bg} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#07100F] border border-[#21312D]">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#B8EE68]" /> : config.icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs font-medium text-[#93A39C]">
              {t('anomaly.label')} · {zonaNombre}
            </span>
            {data && (
              <span className="rounded px-2 py-0.5 font-mono text-xs font-bold" style={{ color: config.color, backgroundColor: `${config.color}20` }}>
                {config.badge}
              </span>
            )}
            {deltaFormatted && categoria !== null && (
              <span className="rounded bg-[#111E1B] border border-[#21312D] px-1.5 py-0.5 font-mono tabular-nums text-xs font-semibold text-[#EFF5ED]">
                {deltaFormatted}
              </span>
            )}
          </div>
          <h3 className="mt-1 font-title text-sm md:text-base font-bold text-[#EFF5ED]">
            {isLoading
              ? isEs ? 'Consultando la API…' : 'Querying the API…'
              : error
                ? isEs ? 'No se pudo calcular la anomalía' : 'Could not compute the anomaly'
                : config.title}
          </h3>
          {data && categoria === null && !isLoading && (
            <p className="mt-0.5 text-xs text-[#93A39C]">
              {isEs
                ? `${mes}: para asignar una categoría hacen falta al menos 10 años de referencia y que el mes esté completo.`
                : `${mes}: assigning a category requires at least 10 reference years and a complete target month.`}
            </p>
          )}
        </div>
      </div>

      {error && !isLoading && (
        <p role="alert" className="mt-3 flex items-start gap-1.5 rounded-md border border-[#FF6759]/40 bg-[#FF6759]/10 px-2.5 py-1.5 text-xs text-[#FF6759]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>{error.message}</span>
        </p>
      )}

      {preliminar && data && !isLoading && (
        <p className="mt-3 flex items-start gap-1.5 rounded-md border border-[#FF9C55]/40 bg-[#FF9C55]/10 px-2.5 py-1.5 text-xs text-[#FF9C55]">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
          <span>
            {isEs
              ? 'Datos preliminares (casi en tiempo real): pueden cambiar cuando se publique el procesamiento definitivo.'
              : 'Preliminary data (near real time): values may change once standard processing is published.'}
          </span>
        </p>
      )}

      {referenceLabel && !isLoading && !error && (
        <p className="mt-3 text-xs text-[#93A39C]">{referenceLabel}</p>
      )}

      {data && !isLoading && (
        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-sans text-xs border-t border-[#21312D]/60 pt-3">
          <div>
            <span className="text-[#93A39C]">{t('anomaly.spotsMonth')} </span>
            <span className="font-mono tabular-nums font-bold text-[#EFF5ED] text-sm">{fmt(data.valor)}</span>
          </div>
          <div className="text-[#93A39C]">·</div>
          <div>
            <span className="text-[#93A39C]">{t('anomaly.median')} </span>
            <span className="font-mono tabular-nums font-semibold text-[#EFF5ED]">{fmt(data.mediana)}</span>
          </div>
          <div className="text-[#93A39C]">·</div>
          <div className="text-[#93A39C]">
            {t('anomaly.range')}{' '}
            <span className="font-mono tabular-nums text-[#EFF5ED]">
              {data.p25 === null || data.p75 === null ? sinDato : `${fmt(data.p25)} – ${fmt(data.p75)}`}
            </span>
          </div>
          <div className="text-[#93A39C]">·</div>
          <div className="text-[#93A39C]">
            {isEs ? 'Percentil:' : 'Percentile:'}{' '}
            <span className="font-mono tabular-nums text-[#68D9D0] font-semibold">
              {data.percentil === null ? sinDato : Math.round(data.percentil)}
            </span>
          </div>
          <div className="text-[#93A39C]">·</div>
          <div className="font-mono tabular-nums text-[#93A39C]">
            ({data.anios_usados} {isEs ? 'años' : 'yrs'})
          </div>
        </div>
      )}
    </div>
  );
};
