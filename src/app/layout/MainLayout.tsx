import React, { useState, useMemo, useEffect, useCallback, Suspense, lazy } from 'react';
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
import { claveDeZona, escribirEstado, leerEstado, zonaDeClave } from '../estadoUrl';
import { CargarAlVer } from '../CargarAlVer';

// El globo trae MapLibre (~300 kB gzip): se descarga recién cuando el mapa se acerca a la
// pantalla, así no compite con la anomalía y el calendario en la carga inicial.
const GloboTerraqueo = lazy(() => import('../../features/globe').then((m) => ({ default: m.GloboTerraqueo })));
import {
  useAnomalia,
  useMetadata,
  useProvincias,
  esZonaRegion,
  pedidoDeZona,
  zoomParaBbox,
  aMes,
  mesAnterior,
  rangoDelMes,
  ZONA_ARGENTINA,
  type Capa,
  type ZonaSeleccionada,
} from '../../api';

interface MainLayoutProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onOpenMethod }) => {
  const { t } = useTranslation();

  // Estado inicial desde la URL (docs/02 §6): se puede compartir y sobrevive a recargar.
  const [inicial] = useState(() => (typeof window !== 'undefined' ? leerEstado(window.location.search) : {}));
  const [zona, setZona] = useState<ZonaSeleccionada>(() => zonaDeClave(inicial.zona ?? 'arg', []) ?? ZONA_ARGENTINA);
  // Las provincias y regiones de la URL requieren el catálogo.
  const [zonaPendiente, setZonaPendiente] = useState(() => {
    const clave = inicial.zona;
    return clave?.startsWith('prov:') || clave?.startsWith('region:') ? clave : null;
  });
  const [escalaFija, setEscalaFija] = useState(false);
  const [capa, setCapa] = useState<Capa>(inicial.capa ?? 'armonizado');
  const [periodoUsuario, setPeriodoUsuario] = useState<Periodo | null>(
    inicial.desde && inicial.hasta ? { desde: inicial.desde, hasta: inicial.hasta } : null
  );
  const [mesMapaUsuario, setMesMapaUsuario] = useState<string | null>(inicial.mes ?? null);

  const { data: metadata, isError: metadataError } = useMetadata();
  const { data: apiProvincias } = useProvincias();
  const mesMin = metadata ? aMes(metadata.fecha_min) : undefined;
  const mesMax = metadata ? aMes(metadata.fecha_max) : undefined;

  const fueraDeDatos = Boolean(periodoUsuario && mesMin && mesMax &&
    (periodoUsuario.desde < mesMin || periodoUsuario.hasta > mesMax));
  const periodoElegido = fueraDeDatos ? null : periodoUsuario;
  const periodo: Periodo = periodoElegido ?? { desde: mesMin ?? '', hasta: mesMax ?? '' };
  const periodoParams = periodoElegido ?? {};
  const mesEnRango = mesMapaUsuario && periodo.hasta &&
    mesMapaUsuario >= periodo.desde && mesMapaUsuario <= periodo.hasta ? mesMapaUsuario : null;

  // Se prioriza el último mes con todos sus días disponibles dentro del rango.
  let mesSugerido = periodo.hasta || null;
  if (mesSugerido && metadata) {
    if (rangoDelMes(mesSugerido).hasta > metadata.fecha_max) mesSugerido = mesAnterior(mesSugerido);
    if (mesSugerido < periodo.desde || rangoDelMes(mesSugerido).desde < metadata.fecha_min) mesSugerido = periodo.hasta;
  }
  const mesMapa = metadata ? (mesEnRango ?? mesSugerido) : null;

  useEffect(() => {
    if (!zonaPendiente || !apiProvincias) return;
    const resuelta = zonaDeClave(zonaPendiente, apiProvincias);
    if (resuelta) setZona(resuelta);
    setZonaPendiente(null);
  }, [zonaPendiente, apiProvincias]);

  useEffect(() => {
    if (!metadata) return;
    if (fueraDeDatos) setPeriodoUsuario(null);
    if (mesMapaUsuario && !mesEnRango) setMesMapaUsuario(null);
  }, [metadata, fueraDeDatos, mesMapaUsuario, mesEnRango]);

  const cambiarPeriodo = (siguiente: Periodo) => {
    setPeriodoUsuario(siguiente);
    setMesMapaUsuario((mes) => mes && mes >= siguiente.desde && mes <= siguiente.hasta ? mes : null);
  };

  const cambiarZona = (siguiente: ZonaSeleccionada) => {
    setZonaPendiente(null);
    setZona(siguiente);
  };

  // Cada cambio se refleja en la URL (sin agregar entradas al historial).
  useEffect(() => {
    if (zonaPendiente || typeof window === 'undefined') return;
    const query = escribirEstado(window.location.search, {
      zona: claveDeZona(zona) ?? undefined,
      desde: periodoElegido?.desde,
      hasta: periodoElegido?.hasta,
      capa,
      mes: (metadata ? mesEnRango : mesMapaUsuario) ?? undefined,
    });
    if (query !== window.location.search) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query}${window.location.hash}`);
    }
  }, [zona, zonaPendiente, periodoElegido, capa, mesMapaUsuario, mesEnRango, metadata]);

  const pedido = useMemo(() => (zonaPendiente ? null : pedidoDeZona(zona)), [zona, zonaPendiente]);
  const anomalia = useAnomalia(mesMapa ? pedido : null, mesMapa ?? undefined);

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
      }
    },
    [apiProvincias]
  );

  const zonaPorCoordenadas = zona.id.startsWith('bbox-');
  const zonaNombre = zonaPorCoordenadas
    ? t('zone.coordinates')
    : zona.id === ZONA_ARGENTINA.id ? t('zone.allCountry') : zona.nombre;

  const selector = (
    <ZoneSelectorWidget
      selectedZone={zona}
      onSelectZone={cambiarZona}
      capa={capa}
      onChangeCapa={setCapa}
      escalaFija={escalaFija}
      onChangeEscala={setEscalaFija}
      periodo={periodo}
      onChangePeriodo={cambiarPeriodo}
      mesMin={mesMin}
      mesMax={mesMax}
      metadataError={metadataError}
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

  const esqueletoGlobo = (
    <div
      className="flex w-full flex-1 items-center justify-center bg-[#07100F] text-xs text-[#93A39C]"
      role="status"
      aria-label={t('globe.loadingMap')}
    >
      {t('globe.loadingMap')}
    </div>
  );

  const globo = (
    <CargarAlVer esqueleto={esqueletoGlobo} className="flex flex-1 flex-col">
      {zonaPendiente ? esqueletoGlobo : (
        <Suspense fallback={esqueletoGlobo}>
          <GloboTerraqueo
            center={zona.center}
            zoom={zona.zoom}
            bbox={zona.bbox}
            mostrarLimites={zonaPorCoordenadas}
            capa={capa}
            month={mesMapa ?? undefined}
            mesDesde={periodo.desde || undefined}
            mesHasta={periodo.hasta || undefined}
            onMonthChange={setMesMapaUsuario}
            geometriaZona={zona.geometria}
            selectedProvinciaId={zona.provincia_id}
            selectedProvinciaIds={selectedProvinciaIds}
            onSelectProvincia={handleSelectProvinciaFromMap}
            className="flex-1 rounded-none border-0"
          />
        </Suspense>
      )}
    </CargarAlVer>
  );

  const descargas = (className: string) => (
    <DownloadsWidget
      zonaNombre={zonaNombre}
      pedido={pedido}
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
      <div id="calendario" className="scroll-mt-20">
        <CalendarHeatmapWidget
          zonaNombre={zonaNombre}
          onOpenMethod={onOpenMethod}
          capa={capa}
          pedido={pedido}
          periodo={periodoParams}
          fechaUltimoSp={metadata?.fecha_ultimo_sp}
          mesMapa={mesMapa}
          onElegirMes={setMesMapaUsuario}
          escalaFija={escalaFija}
          className="rounded-none border-0 bg-transparent"
        />
      </div>
      <AnomalyWidget
        zonaNombre={zonaNombre}
        data={anomalia.data}
        isLoading={anomalia.isLoading}
        error={anomalia.error}
        preliminar={preliminar}
        className="rounded-none border-0 bg-transparent"
      />
    </>
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 md:px-8 space-y-6">
      <div id="explorar" className="scroll-mt-20 space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-[#21312D] bg-[#0D1816] p-4 lg:flex-row lg:items-start">
          {selector}
          {descargas('lg:max-w-64 lg:pt-6')}
        </div>
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
          <section
            aria-label={t('zone.calendarAndComparison')}
            className="min-w-0 overflow-hidden rounded-xl border border-[#21312D] bg-[#0D1816] divide-y divide-[#21312D] lg:col-span-5 lg:col-start-8 lg:row-start-1"
          >
            {diagnostico}
          </section>
          <section
            id="mapa"
            aria-label={t('globe.title')}
            className="flex h-[420px] min-w-0 flex-col scroll-mt-20 overflow-hidden rounded-xl border border-[#21312D] bg-[#07100F] lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:h-auto lg:min-h-[560px] lg:self-stretch xl:min-h-[620px]"
          >
            {globo}
          </section>
          {serie('min-w-0 overflow-hidden rounded-xl border border-[#21312D] bg-[#0D1816] lg:col-span-12')}
        </div>
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
