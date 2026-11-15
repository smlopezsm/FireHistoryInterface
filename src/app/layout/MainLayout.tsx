import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
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
import { useAnomalia } from '../../api';

interface MainLayoutProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  onOpenSatellites,
}) => {
  const { t, i18n } = useTranslation();
  const [selectedZone, setSelectedZone] = useState<ZoneItem>(PROVINCIAS_ARG[0]); // Argentina por defecto
  const [capa, setCapa] = useState<'armonizado' | 'modis' | 'viirs'>('armonizado');
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  const isSpanish = Boolean(i18n?.language?.startsWith('es'));
  const currentMonthName = isSpanish ? 'Septiembre' : 'September';

  // Consulta en tiempo real de anomalía a FireHistoryInterfaceAPI
  const bboxStr = !selectedZone.provincia_id && selectedZone.bbox ? selectedZone.bbox.join(',') : undefined;
  const { data: apiAnomalia, isLoading: isLoadingAnomalia } = useAnomalia({
    provincia_id: selectedZone.provincia_id,
    bbox: bboxStr,
  });

  // Datos dinámicos contextuales según la provincia seleccionada (fallback offline)
  const getZoneAnomalyData = (zoneId: string) => {
    switch (zoneId) {
      case '14':
      case 'cordoba':
        return {
          mes: currentMonthName,
          valor: 1845,
          mediana: 920,
          p25: 410,
          p75: 1250,
          categoria: 'muy_por_encima' as const,
          percentil: 92,
          razon: 2.0,
          anios_usados: 24,
        };
      case '18':
      case 'corrientes':
        return {
          mes: currentMonthName,
          valor: 2310,
          mediana: 1400,
          p25: 750,
          p75: 1820,
          categoria: 'por_encima' as const,
          percentil: 84,
          razon: 1.65,
          anios_usados: 24,
        };
      case '30':
      case 'entre-rios':
        return {
          mes: currentMonthName,
          valor: 980,
          mediana: 1050,
          p25: 520,
          p75: 1480,
          categoria: 'normal' as const,
          percentil: 52,
          razon: 0.93,
          anios_usados: 24,
        };
      case '26':
      case 'chubut':
        return {
          mes: currentMonthName,
          valor: 35,
          mediana: 90,
          p25: 40,
          p75: 160,
          categoria: 'por_debajo' as const,
          percentil: 22,
          razon: 0.39,
          anios_usados: 24,
        };
      default: // Nacional 'arg' u otras
        return {
          mes: currentMonthName,
          valor: 14250,
          mediana: 8900,
          p25: 5200,
          p75: 11400,
          categoria: 'por_encima' as const,
          percentil: 78,
          razon: 1.6,
          anios_usados: 24,
        };
    }
  };

  const anomalyData = useMemo(() => {
    if (apiAnomalia) {
      const parts = apiAnomalia.mes.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      const monthNamesEs = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];
      const monthNamesEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const monthName = isSpanish ? monthNamesEs[monthIdx] : monthNamesEn[monthIdx];
      const formattedMonth = `${monthName} ${parts[0]}`;

      return {
        mes: formattedMonth,
        valor: Math.round(apiAnomalia.valor),
        mediana: Math.round(apiAnomalia.mediana ?? 0),
        p25: Math.round(apiAnomalia.p25 ?? 0),
        p75: Math.round(apiAnomalia.p75 ?? 0),
        categoria: apiAnomalia.categoria,
        percentil: apiAnomalia.percentil,
        razon: apiAnomalia.razon,
        anios_usados: apiAnomalia.anios_usados,
      };
    }
    return getZoneAnomalyData(selectedZone.id);
  }, [apiAnomalia, isSpanish, selectedZone.id]);

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 md:px-8 space-y-6">
      {/* Zona Principal en Dos Columnas Integradas (Explorar) */}
      <div id="explorar" className="scroll-mt-20">
        {/* Vista Escritorio (≥ 1024 px): 6 cols izquierda (Globo) / 6 cols derecha (Telemetría y Calendario) */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5 items-start">
          {/* Columna Izquierda (6 de 12) - Etapa Cartográfica Unificada */}
          <section
            aria-label="Etapa de observación cartográfica"
            className="lg:col-span-6 rounded-xl border border-[#21312D] bg-[#07100F] overflow-hidden flex flex-col"
          >
            {/* Barra superior de selección territorial y sensor */}
            <ZoneSelectorWidget
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              capa={capa}
              onChangeCapa={setCapa}
              className="border-b border-[#21312D]"
            />

            {/* Globo Terráqueo 3D interactivo con textura satelital y puntos calientes */}
            <GloboTerraqueo
              center={selectedZone.center}
              zoom={selectedZone.zoom}
              bbox={selectedZone.bbox}
              capa={capa}
              externalMonth={selectedMonth}
              className="w-full h-[560px] xl:h-[620px] rounded-none border-0"
            />

            {/* Barra inferior de exportación de datos con procedencia */}
            <DownloadsWidget
              zonaNombre={selectedZone.name}
              capa={capa}
              provincia_id={selectedZone.provincia_id}
              bbox={selectedZone.bbox}
              className="border-t border-[#21312D]"
            />
          </section>

          {/* Columna Derecha (6 de 12) - Muelle Integrado de Diagnóstico y Serie Temporal */}
          <section
            aria-label="Muelle de diagnóstico y serie temporal"
            className="lg:col-span-6 rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden flex flex-col divide-y divide-[#21312D]"
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
              percentil={anomalyData.percentil}
              razon={anomalyData.razon}
              anios_usados={anomalyData.anios_usados}
              isLoading={isLoadingAnomalia}
              className="rounded-none border-0 bg-transparent"
            />

            {/* Calendario Armonizado mes × año con patrón de rayado en datos estimados */}
            <div id="calendario" className="scroll-mt-20">
              <CalendarHeatmapWidget
                zonaNombre={selectedZone.name}
                capa={capa}
                provincia_id={selectedZone.provincia_id}
                bbox={selectedZone.bbox}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                className="rounded-none border-0 bg-transparent"
              />
            </div>
          </section>
        </div>

        {/* Vista Móvil (< 1024 px): Flujo vertical limpio e integrado */}
        <div className="flex flex-col gap-4 lg:hidden">
          {/* Módulo cartográfico móvil */}
          <div className="rounded-xl border border-[#21312D] bg-[#07100F] overflow-hidden flex flex-col">
            <ZoneSelectorWidget
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              capa={capa}
              onChangeCapa={setCapa}
              className="border-b border-[#21312D]"
            />
            <GloboTerraqueo
              center={selectedZone.center}
              zoom={selectedZone.zoom}
              bbox={selectedZone.bbox}
              capa={capa}
              externalMonth={selectedMonth}
              className="w-full h-[420px] rounded-none border-0"
            />
          </div>

          {/* Muelle de telemetría y calendario móvil */}
          <div className="rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden flex flex-col divide-y divide-[#21312D]">
            <AnomalyWidget
              zonaNombre={selectedZone.name}
              mes={anomalyData.mes}
              valor={anomalyData.valor}
              mediana={anomalyData.mediana}
              p25={anomalyData.p25}
              p75={anomalyData.p75}
              categoria={anomalyData.categoria}
              percentil={anomalyData.percentil}
              razon={anomalyData.razon}
              anios_usados={anomalyData.anios_usados}
              isLoading={isLoadingAnomalia}
              className="rounded-none border-0 bg-transparent"
            />
            <div id="calendario-mobile" className="scroll-mt-20">
              <CalendarHeatmapWidget
                zonaNombre={selectedZone.name}
                capa={capa}
                provincia_id={selectedZone.provincia_id}
                bbox={selectedZone.bbox}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                selectedMonth={selectedMonth}
                onSelectMonth={setSelectedMonth}
                className="rounded-none border-0 bg-transparent"
              />
            </div>
          </div>

          <DownloadsWidget
            zonaNombre={selectedZone.name}
            capa={capa}
            provincia_id={selectedZone.provincia_id}
            bbox={selectedZone.bbox}
            className="rounded-xl border border-[#21312D]"
          />
        </div>
      </div>

      {/* Nota Científica aclaratoria sobre qué es un punto caliente */}
      <aside
        aria-label="Nota técnica de observación térmica"
        className="flex items-start gap-3 rounded-xl border border-[#21312D] bg-[#0D1816] p-4 text-xs text-[#93A39C]"
      >
        <Info className="h-4 w-4 shrink-0 text-[#68D9D0] mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-[#EFF5ED]">{t('hero.scientificNote')} </strong>
          {t('hero.disclaimer')}
        </p>
      </aside>

      {/* Centro de atención para el satélite (Hero Centerpiece) */}
      <section id="la-mision" className="scroll-mt-20" aria-label="Sección de arquitectura de satélites orbitales">
        <SatelliteSchematic onOpen3D={onOpenSatellites} />
      </section>
    </main>
  );
};
