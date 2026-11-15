import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import {
  ZoneSelectorWidget,
  AnomalyWidget,
  CalendarHeatmapWidget,
  DownloadsWidget,
  SeriesWidget,
  type Periodo,
} from '../../features/dashboard';
import { GloboTerraqueo } from '../../features/globe';
import {
  useAnomalia,
  useMetadata,
  useProvincias,
  esZonaRegion,
  pedidoDeZona,
  zoomParaBbox,
  aMes,
  mesAnterior,
  ZONA_ARGENTINA,
  type Capa,
  type ZonaSeleccionada,
} from '../../api';

interface MainLayoutProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
}

/** true en escritorio (≥ 1024 px). Evita montar dos mapas a la vez. */
function useIsDesktop() {
  const query = '(min-width: 1024px)';
  const get = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : true;
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);
  return isDesktop;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onOpenMethod }) => {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const [zona, setZona] = useState<ZonaSeleccionada>(ZONA_ARGENTINA);
  const [capa, setCapa] = useState<Capa>('armonizado');
  const [periodoUsuario, setPeriodoUsuario] = useState<Periodo | null>(null);
  const [mesMapaUsuario, setMesMapaUsuario] = useState<string | null>(null);

  const { data: metadata } = useMetadata();
  const { data: apiProvincias } = useProvincias();
  const mesMin = metadata ? aMes(metadata.fecha_min) : undefined;
  const mesMax = metadata ? aMes(metadata.fecha_max) : undefined;

  // Sin elección del usuario, la API usa todo el registro por defecto.
  const periodo: Periodo = periodoUsuario ?? { desde: mesMin ?? '2000-11', hasta: mesMax ?? '' };
  const periodoParams = periodoUsuario ?? {};

  // El mapa muestra un mes; por defecto el último mes completo.
  const mesPrevio = mesMax ? mesAnterior(mesMax) : null;
  const mesInicialMapa = mesMin && mesPrevio && mesPrevio >= mesMin ? mesPrevio : mesMax;
  const mesMapa = mesMapaUsuario && mesMin && mesMax && mesMapaUsuario >= mesMin && mesMapaUsuario <= mesMax
    ? mesMapaUsuario
    : mesInicialMapa ?? null;

  const pedido = useMemo(() => pedidoDeZona(zona), [zona]);
  const anomalia = useAnomalia(pedido);

  const preliminar = Boolean(
    metadata && anomalia.data && anomalia.data.mes > aMes(metadata.fecha_ultimo_sp),
  );

  const handleSelectProvinciaFromMap = useCallback(
    (provinciaId: string | null) => {
      if (!provinciaId) {
        setZona(ZONA_ARGENTINA);
        return;
      }
      const match = apiProvincias?.find((p) => p.provincia_id === provinciaId);
      if (match) {
        setZona({
          id: match.provincia_id,
          provincia_id: match.provincia_id,
          nombre: match.nombre,
          region: match.region,
          center: [(match.bbox[0] + match.bbox[2]) / 2, (match.bbox[1] + match.bbox[3]) / 2],
          zoom: zoomParaBbox(match.bbox),
          bbox: match.bbox,
        });
      } else {
        setZona({
          id: provinciaId,
          provincia_id: provinciaId,
          nombre: `Provincia ${provinciaId}`,
          region: 'Argentina',
          center: zona.center,
          zoom: 5.5,
        });
      }
    },
    [apiProvincias, zona.center]
  );

  const zonaNombre =
    zona.id === ZONA_ARGENTINA.id ? t('zone.allCountry') : zona.nombre;

  const selector = (
    <ZoneSelectorWidget
      selectedZone={zona}
      onSelectZone={setZona}
      capa={capa}
      onChangeCapa={setCapa}
      periodo={periodo}
      onChangePeriodo={setPeriodoUsuario}
      mesMin={mesMin}
      mesMax={mesMax}
      className="border-b border-[#21312D]"
    />
  );

  const selectedProvinciaIds = useMemo(() => {
    if (zona.provincia_id) return [zona.provincia_id];
    if (esZonaRegion(zona) && apiProvincias) {
      return apiProvincias
        .filter((p) => p.region === zona.region)
        .map((p) => p.provincia_id);
    }
    return [];
  }, [zona, apiProvincias]);

  const globo = (heightClass: string) => (
    <GloboTerraqueo
      center={zona.center}
      zoom={zona.zoom}
      bbox={zona.bbox}
      capa={capa}
      month={mesMapa ?? undefined}
      onMonthChange={setMesMapaUsuario}
      geometriaZona={zona.geometria}
      selectedProvinciaId={zona.provincia_id}
      selectedProvinciaIds={selectedProvinciaIds}
      onSelectProvincia={handleSelectProvinciaFromMap}
      className={`w-full ${heightClass} rounded-none border-0`}
    />
  );

  const descargas = (className: string) => (
    <DownloadsWidget
      zonaNombre={zonaNombre}
      pedido={pedido}
      capa={capa}
      periodo={periodoParams}
      mesMapa={mesMapa}
      fechaMin={metadata?.fecha_min}
      fechaMax={metadata?.fecha_max}
      className={className}
    />
  );

  const serie = (className: string) => (
    <div className={className}>
      <SeriesWidget
        zonaNombre={zonaNombre}
        capa={capa}
        pedido={pedido}
        periodo={periodoParams}
        fechaMin={metadata?.fecha_min}
        fechaMax={metadata?.fecha_max}
        className="bg-transparent"
      />
    </div>
  );

  const diagnostico = (
    <>
      <AnomalyWidget
        zonaNombre={zonaNombre}
        data={anomalia.data}
        isLoading={anomalia.isLoading}
        error={anomalia.error}
        preliminar={preliminar}
        className="rounded-none border-0 bg-transparent"
      />
      <div id="calendario" className="scroll-mt-20">
        <CalendarHeatmapWidget
          zonaNombre={zonaNombre}
          onOpenMethod={onOpenMethod}
          capa={capa}
          pedido={pedido}
          periodo={periodoParams}
          fechaUltimoSp={metadata?.fecha_ultimo_sp}
          className="rounded-none border-0 bg-transparent"
        />
      </div>
    </>
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 md:px-8 space-y-6">
      <div id="explorar" className="scroll-mt-20">
        {isDesktop ? (
          <div className="grid grid-cols-12 gap-5 items-start">
            <section
              aria-label="Etapa de observación cartográfica"
              className="col-span-7 rounded-xl border border-[#21312D] bg-[#07100F] overflow-hidden flex flex-col"
            >
              {selector}
              {globo('h-[560px] xl:h-[620px]')}
              {descargas('border-t border-[#21312D]')}
            </section>
            <section
              aria-label="Muelle de diagnóstico y serie temporal"
              className="col-span-5 rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden flex flex-col divide-y divide-[#21312D]"
            >
              {diagnostico}
            </section>
            {serie('col-span-12 rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[#21312D] bg-[#07100F] overflow-hidden flex flex-col">
              {selector}
              {globo('h-[420px]')}
            </div>
            <div className="rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden flex flex-col divide-y divide-[#21312D]">
              {diagnostico}
            </div>
            {serie('rounded-xl border border-[#21312D] bg-[#0D1816] overflow-hidden')}
            {descargas('rounded-xl border border-[#21312D]')}
          </div>
        )}
      </div>

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

    </main>
  );
};
