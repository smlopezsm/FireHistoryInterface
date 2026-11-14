import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Info, Orbit } from 'lucide-react';
import {
  ZoneSelectorWidget,
  PROVINCIAS_ARG,
  type ZoneItem,
  AnomalyWidget,
  CalendarHeatmapWidget,
  DownloadsWidget,
} from '../../features/dashboard';
import { GloboTerraqueo } from '../../features/globe';
import { SatelliteSchematic } from '../../features/satellite-schematic';

interface MainLayoutProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  onOpenMethod,
  onOpenSatellites,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<ZoneItem>(PROVINCIAS_ARG[0]); // Argentina por defecto
  const [capa, setCapa] = useState<'armonizado' | 'modis' | 'viirs'>('armonizado');

  const currentMonthName = Boolean(i18n?.language?.startsWith('es')) ? 'Septiembre' : 'September';

  // Datos dinámicos contextuales según la provincia seleccionada
  const getZoneAnomalyData = (zoneId: string) => {
    switch (zoneId) {
      case 'cordoba':
        return {
          mes: currentMonthName,
          valor: 1845,
          mediana: 920,
          p25: 410,
          p75: 1250,
          categoria: 'muy_por_encima' as const,
        };
      case 'corrientes':
        return {
          mes: currentMonthName,
          valor: 2310,
          mediana: 1400,
          p25: 750,
          p75: 1820,
          categoria: 'por_encima' as const,
        };
      case 'entre-rios':
        return {
          mes: currentMonthName,
          valor: 980,
          mediana: 1050,
          p25: 520,
          p75: 1480,
          categoria: 'normal' as const,
        };
      case 'chubut':
        return {
          mes: currentMonthName,
          valor: 35,
          mediana: 90,
          p25: 40,
          p75: 160,
          categoria: 'por_debajo' as const,
        };
      default: // Nacional 'arg' u otras
        return {
          mes: currentMonthName,
          valor: 14250,
          mediana: 8900,
          p25: 5200,
          p75: 11400,
          categoria: 'por_encima' as const,
        };
    }
  };

  const anomalyData = getZoneAnomalyData(selectedZone.id);

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 space-y-8">
      {/* 1. Encabezado Editorial Hero */}
      <section
        aria-label="Presentación editorial"
        className="relative rounded-2xl border border-[#21312D] bg-gradient-to-r from-[#0D1816] via-[#091311] to-[#07100F] p-6 md:p-8 shadow-xl"
      >
        <div className="max-w-4xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#B8EE68]" />
            <span className="font-mono text-xs uppercase tracking-widest text-[#B8EE68]">
              NASA Space Apps Challenge 2026 · Observatorio Térmico
            </span>
          </div>

          <h2 className="font-title text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#EFF5ED] leading-tight">
            {t('hero.headline')}
          </h2>

          <p className="text-sm md:text-base leading-relaxed text-[#93A39C]">
            {t('hero.subtitle')}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenMethod}
              className="inline-flex items-center gap-2 rounded-lg border border-[#21312D] bg-[#111E1B] px-3.5 py-2 font-mono text-xs font-semibold text-[#EFF5ED] hover:border-[#B8EE68]/50 hover:bg-[#1A332C]/50 hover:text-[#B8EE68] transition-all focus:outline-none focus:ring-2 focus:ring-[#B8EE68]"
            >
              <HelpCircle className="h-4 w-4 text-[#B8EE68]" />
              <span>{t('hero.methodCta')}</span>
            </button>

            {onOpenSatellites && (
              <button
                type="button"
                onClick={onOpenSatellites}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B8EE68]/30 bg-[#B8EE68]/10 px-3.5 py-2 font-mono text-xs font-semibold text-[#B8EE68] hover:bg-[#B8EE68]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#B8EE68]"
              >
                <Orbit className="h-4 w-4" />
                <span>{t('hero.satelliteCta')}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Zona Principal en Dos Columnas (Explorar) */}
      <div id="explorar" className="scroll-mt-20">
        {/* Vista Escritorio (≥ 1024 px): 7 cols izquierda (Globo + Controles) / 5 cols derecha (Análisis) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          {/* Columna Amplia Izquierda (7 columnas de 12) */}
          <section
            aria-label="Columna de mapa y controles espaciales"
            className="lg:col-span-7 flex flex-col gap-4"
          >
            {/* Selector de zona y sensor */}
            <ZoneSelectorWidget
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              capa={capa}
              onChangeCapa={setCapa}
            />

            {/* Globo Terráqueo 3D interactivo con textura satelital y puntos calientes */}
            <GloboTerraqueo
              center={selectedZone.center}
              zoom={selectedZone.zoom}
              capa={capa}
            />

            {/* Descargas de datos con procedencia */}
            <DownloadsWidget zonaNombre={selectedZone.name} capa={capa} />
          </section>

          {/* Columna Lateral Derecha (5 columnas de 12) */}
          <section
            aria-label="Columna de diagnóstico y calendario histórico"
            className="lg:col-span-5 flex flex-col gap-4"
          >
            {/* Widget de Anomalía vs Mediana histórica */}
            <AnomalyWidget
              zonaNombre={selectedZone.name}
              mes={anomalyData.mes}
              valor={anomalyData.valor}
              mediana={anomalyData.mediana}
              p25={anomalyData.p25}
              p75={anomalyData.p75}
              categoria={anomalyData.categoria}
            />

            {/* Calendario Armonizado mes × año con patrón de rayado en datos estimados */}
            <div id="calendario" className="scroll-mt-20">
              <CalendarHeatmapWidget
                zonaNombre={selectedZone.name}
                capa={capa}
              />
            </div>
          </section>
        </div>

        {/* Vista Móvil (< 1024 px): Flujo vertical optimizado */}
        <div className="flex flex-col gap-5 lg:hidden">
          <ZoneSelectorWidget
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            capa={capa}
            onChangeCapa={setCapa}
          />
          <AnomalyWidget
            zonaNombre={selectedZone.name}
            mes={anomalyData.mes}
            valor={anomalyData.valor}
            mediana={anomalyData.mediana}
            p25={anomalyData.p25}
            p75={anomalyData.p75}
            categoria={anomalyData.categoria}
          />
          <GloboTerraqueo
            center={selectedZone.center}
            zoom={selectedZone.zoom}
            capa={capa}
          />
          <div id="calendario-mobile" className="scroll-mt-20">
            <CalendarHeatmapWidget
              zonaNombre={selectedZone.name}
              capa={capa}
            />
          </div>
          <DownloadsWidget zonaNombre={selectedZone.name} capa={capa} />
        </div>
      </div>

      {/* 3. Nota Científica aclaratoria sobre qué es un punto caliente */}
      <aside
        aria-label="Nota técnica de observación térmica"
        className="flex items-start gap-3 rounded-xl border border-[#21312D] bg-[#0D1816] p-4 text-xs text-[#93A39C]"
      >
        <Info className="h-5 w-5 shrink-0 text-[#68D9D0] mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-[#EFF5ED]">{t('hero.scientificNote')} </strong>
          {t('hero.disclaimer')}
        </p>
      </aside>

      {/* 4. Centro de atención para el satélite (Hero Centerpiece) */}
      <section aria-label="Sección de arquitectura de satélites orbitales">
        <SatelliteSchematic onOpen3D={onOpenSatellites} />
      </section>
    </main>
  );
};
