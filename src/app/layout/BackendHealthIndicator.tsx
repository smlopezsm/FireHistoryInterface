import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Database,
  Calendar,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { useHealth, useMetadata, API_BASE_URL } from '../../api';

export const BackendHealthIndicator: React.FC = () => {
  const { i18n } = useTranslation();
  const isSpanish = Boolean(i18n?.language?.startsWith('es'));
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const {
    data: health,
    isLoading: isLoadingHealth,
    isError: isHealthError,
    refetch: refetchHealth,
    isFetching: isFetchingHealth,
  } = useHealth();

  const { data: metadata } = useMetadata();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Determinar estado de conexión
  const isOnline = !isHealthError && health?.estado === 'ok' && health?.datos_listos;
  const isDegraded = !isHealthError && health && (!health.datos_listos || health.estado !== 'ok');
  const isOffline = isHealthError || (!isLoadingHealth && !health);

  const statusColor = isOnline
    ? '#B8EE68'
    : isDegraded
      ? '#FF9C55'
      : isOffline
        ? '#FF6759'
        : '#93A39C';

  const statusLabel = isLoadingHealth
    ? isSpanish
      ? 'Conectando...'
      : 'Connecting...'
    : isOnline
      ? isSpanish
        ? 'API Online'
        : 'API Online'
      : isDegraded
        ? isSpanish
          ? 'API Degradada'
          : 'API Degraded'
        : isSpanish
          ? 'API Offline'
          : 'API Offline';

  return (
    <div
      className="inline-flex items-center sm:relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Botón / Indicador compacto de estado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`${isSpanish ? 'Estado del backend' : 'Backend status'}: ${statusLabel}`}
        title={`${statusLabel}${metadata?.factores_version && isOnline ? ` · v${metadata.factores_version}` : ''}`}
        className="group inline-flex h-9 w-8 items-center justify-center rounded-md border border-[#21312D] bg-[#0D1816] transition-all hover:border-[#2A3F3A] hover:bg-[#111E1B] focus:outline-none focus:ring-1 focus:ring-[#B8EE68] sm:w-9"
      >
        {/* Indicador LED con animación de pulso cuando está online */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          {isOnline && (
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: statusColor }}
            />
          )}
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
        </span>
      </button>

      {/* Tooltip / Tarjeta flotante al pasar el mouse */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute right-3 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-[#21312D] bg-[#07100F]/95 p-3.5 text-xs text-[#EFF5ED] shadow-2xl backdrop-blur-md animate-fade-in sm:right-0"
        >
          {/* Cabecera del estado */}
          <div className="flex items-center justify-between border-b border-[#21312D] pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {isOnline ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isDegraded ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <span className="font-title font-bold text-[#EFF5ED] text-xs">
                  {isSpanish ? 'Servicio FireHistoryInterfaceAPI' : 'FireHistoryInterfaceAPI Service'}
                </span>
                <p className="font-sans text-[11px] text-[#93A39C]">
                  {isOnline
                    ? isSpanish
                      ? 'Backend FastAPI + DuckDB conectado'
                      : 'Backend FastAPI + DuckDB connected'
                    : isDegraded
                      ? isSpanish
                        ? 'Servidor activo sin datos DuckDB listos'
                        : 'Server active, DuckDB data not ready'
                      : isSpanish
                        ? 'Servidor local no detectado'
                        : 'Local server not detected'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetchHealth()}
              title={isSpanish ? 'Reintentar chequeo' : 'Retry health check'}
              className="rounded p-1 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isFetchingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Información técnica detallada */}
          <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
            {/* Endpoint */}
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-[#93A39C] flex items-center gap-1">
                <Server className="h-3 w-3 text-[#68D9D0]" />
                <span>Base URL:</span>
              </span>
              <span className="truncate text-[#EFF5ED] font-semibold" title={API_BASE_URL}>
                {API_BASE_URL}
              </span>
            </div>

            {/* Versión de datos */}
            <div className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-[#93A39C] flex items-center gap-1">
                <Database className="h-3 w-3 text-[#B8EE68]" />
                <span>{isSpanish ? 'Versión datos:' : 'Data version:'}</span>
              </span>
              <span className="text-[#EFF5ED]">
                {health?.data_version
                  ? health.data_version.slice(0, 19).replace('T', ' ')
                  : metadata?.data_version
                    ? metadata.data_version.slice(0, 19).replace('T', ' ')
                    : isOnline
                      ? 'OK'
                      : '—'}
              </span>
            </div>

            {/* Versión de factores de calibración */}
            {metadata?.factores_version && (
              <div className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-[#93A39C] flex items-center gap-1">
                  <Layers className="h-3 w-3 text-[#FF9C55]" />
                  <span>{isSpanish ? 'Factores:' : 'Factors:'}</span>
                </span>
                <span className="text-[#EFF5ED] font-bold text-[#B8EE68]">
                  v{metadata.factores_version}
                </span>
              </div>
            )}

            {/* Fecha máxima disponible */}
            {(health?.fecha_max || metadata?.fecha_max) && (
              <div className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-[#93A39C] flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-[#68D9D0]" />
                  <span>{isSpanish ? 'Datos hasta:' : 'Latest data:'}</span>
                </span>
                <span className="text-[#EFF5ED] font-semibold">
                  {health?.fecha_max || metadata?.fecha_max}
                </span>
              </div>
            )}

            {/* Celdas totales registradas */}
            {metadata?.celdas_total !== undefined && (
              <div className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-[#93A39C]">{isSpanish ? 'Celdas 5×5km:' : '5×5km Cells:'}</span>
                <span className="text-[#EFF5ED]">{metadata.celdas_total.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Ayuda contextual si está offline */}
          {isOffline && (
            <div className="mt-2.5 rounded bg-[#FF6759]/10 border border-[#FF6759]/20 p-2 font-sans text-[11px] text-[#EFF5ED] leading-relaxed">
              <p className="font-semibold text-[#FF6759] flex items-center gap-1 mb-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{isSpanish ? 'Modo sin conexión' : 'Offline Mode'}</span>
              </p>
              <p className="text-[#93A39C]">
                {isSpanish
                  ? 'El front está utilizando estimaciones y muestras locales. Para conectar el motor real de datos, inicia el servidor backend:'
                  : 'Frontend is running on local samples. To connect the real data engine, start the backend server:'}
              </p>
              <code className="mt-1 block rounded bg-[#07100F] px-1.5 py-1 font-mono text-[10px] text-[#B8EE68] border border-[#21312D]">
                uvicorn app.main:app --reload
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
