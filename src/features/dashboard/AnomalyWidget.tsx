import React from 'react';
import type { CategoriaAnomalia } from '../../api/types';
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnomalyWidgetProps {
  zonaNombre: string;
  mes: string;
  valor: number;
  mediana: number;
  p25: number;
  p75: number;
  categoria: CategoriaAnomalia | null;
}

export const AnomalyWidget: React.FC<AnomalyWidgetProps> = ({
  zonaNombre,
  mes,
  valor,
  mediana,
  p25,
  p75,
  categoria,
}) => {
  const getCategoryConfig = () => {
    switch (categoria) {
      case 'muy_por_encima':
        return {
          title: `Mucho más fuego que lo normal para ${mes}`,
          subtitle: 'Actividad crítica muy por encima del percentil 75',
          badge: 'Crítica ▲▲',
          color: '#FF6759',
          bg: 'bg-[#FF6759]/10',
          border: 'border-[#FF6759]/40',
          icon: <TrendingUp className="h-5 w-5 text-[#FF6759]" />,
        };
      case 'por_encima':
        return {
          title: `Más fuego que lo normal para ${mes}`,
          subtitle: 'Por encima de la mediana histórica',
          badge: 'Elevada ▲',
          color: '#FF9C55',
          bg: 'bg-[#FF9C55]/10',
          border: 'border-[#FF9C55]/40',
          icon: <TrendingUp className="h-5 w-5 text-[#FF9C55]" />,
        };
      case 'normal':
        return {
          title: `Dentro de lo normal para ${mes}`,
          subtitle: 'Comportamiento en rango intercuartílico típico',
          badge: 'Normal ●',
          color: '#93A39C',
          bg: 'bg-[#93A39C]/10',
          border: 'border-[#21312D]',
          icon: <Minus className="h-5 w-5 text-[#93A39C]" />,
        };
      case 'por_debajo':
        return {
          title: `Menos fuego que lo normal para ${mes}`,
          subtitle: 'Por debajo de la mediana histórica',
          badge: 'Baja ▼',
          color: '#68D9D0',
          bg: 'bg-[#68D9D0]/10',
          border: 'border-[#68D9D0]/40',
          icon: <TrendingDown className="h-5 w-5 text-[#68D9D0]" />,
        };
      case 'muy_por_debajo':
        return {
          title: `Mucho menos fuego que lo normal para ${mes}`,
          subtitle: 'Mínimos históricos de focos térmicos',
          badge: 'Mínima ▼▼',
          color: '#3D786E',
          bg: 'bg-[#3D786E]/15',
          border: 'border-[#3D786E]/40',
          icon: <TrendingDown className="h-5 w-5 text-[#3D786E]" />,
        };
      default:
        return {
          title: 'No hay suficientes años para comparar',
          subtitle: 'Se requiere serie histórica mínima para evaluar anomalía',
          badge: 'Sin dato',
          color: '#93A39C',
          bg: 'bg-[#111E1B]',
          border: 'border-[#21312D]',
          icon: <AlertCircle className="h-5 w-5 text-[#93A39C]" />,
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <div
      role="region"
      aria-label="Diagnóstico de anomalía térmica"
      className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#07100F] border border-[#21312D]">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#93A39C]">
                Anomalía Mensual · {zonaNombre}
              </span>
              <span
                className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                style={{ color: config.color, backgroundColor: `${config.color}20` }}
              >
                {config.badge}
              </span>
            </div>
            <h3 className="mt-0.5 font-title text-sm md:text-base font-bold text-[#EFF5ED]">
              {config.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs border-t border-[#21312D]/60 pt-2.5">
        <div>
          <span className="text-[#93A39C]">Focos mes: </span>
          <span className="font-bold text-[#EFF5ED] text-sm">{valor.toLocaleString('es-AR')}</span>
        </div>
        <div className="text-[#93A39C]">·</div>
        <div>
          <span className="text-[#93A39C]">Mediana histórica: </span>
          <span className="font-semibold text-[#EFF5ED]">{mediana.toLocaleString('es-AR')}</span>
        </div>
        <div className="text-[#93A39C]">·</div>
        <div className="text-[11px] text-[#93A39C]">
          Rango habitual: <span className="text-[#EFF5ED]">{p25} – {p75}</span>
        </div>
      </div>
    </div>
  );
};
