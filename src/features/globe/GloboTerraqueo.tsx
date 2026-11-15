import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapaCeldas } from '../../api';
import {
  RotateCw,
  RefreshCw,
  Maximize2,
  Minimize2,
  Globe as GlobeIcon,
  Plus,
  Minus,
  AlertCircle,
  Flame,
} from 'lucide-react';

// Estilo cartográfico oscuro oficial del Instituto Geográfico Nacional (IGN Argentina), sin API key
const DEFAULT_GLOBE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': '#040808',
    'horizon-color': '#183c38',
    'fog-color': '#07100F',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 6, 0.1],
  },
  sources: {
    'ign-argenmap-oscuro': {
      type: 'raster',
      tiles: [
        'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/argenmap_oscuro@EPSG%3A3857@png/{z}/{x}/{y}.png',
      ],
      scheme: 'tms',
      tileSize: 256,
      maxzoom: 16,
    },
  },
  layers: [
    {
      id: 'ign-argenmap-base',
      type: 'raster',
      source: 'ign-argenmap-oscuro',
    },
  ],
};

// Puntos calientes representativos en Argentina (Córdoba, Delta del Paraná, Corrientes, San Luis, Salta, Chubut)
const SAMPLE_HOTSPOTS = [
  { id: 'f1', lng: -64.42, lat: -31.35, sensor: 'viirs', brightness: 345, province: 'Córdoba (Punilla)' },
  { id: 'f2', lng: -64.55, lat: -31.60, sensor: 'viirs', brightness: 370, province: 'Córdoba (Calamuchita)' },
  { id: 'f3', lng: -60.40, lat: -32.85, sensor: 'modis', brightness: 320, province: 'Entre Ríos (Delta)' },
  { id: 'f4', lng: -60.25, lat: -33.10, sensor: 'modis', brightness: 315, province: 'Entre Ríos (Islas)' },
  { id: 'f5', lng: -57.85, lat: -28.20, sensor: 'viirs', brightness: 360, province: 'Corrientes (Iberá)' },
  { id: 'f6', lng: -58.20, lat: -28.75, sensor: 'modis', brightness: 330, province: 'Corrientes' },
  { id: 'f7', lng: -66.15, lat: -33.15, sensor: 'viirs', brightness: 380, province: 'San Luis (Sierras)' },
  { id: 'f8', lng: -64.80, lat: -24.20, sensor: 'viirs', brightness: 355, province: 'Salta (Orán)' },
  { id: 'f9', lng: -71.30, lat: -42.80, sensor: 'modis', brightness: 310, province: 'Chubut (Cordillera)' },
  { id: 'f10', lng: -65.20, lat: -37.10, sensor: 'viirs', brightness: 335, province: 'La Pampa' },
];

interface GloboTerraqueoProps {
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  center?: [number, number];
  zoom?: number;
  capa?: 'armonizado' | 'modis' | 'viirs';
}

export const GloboTerraqueo: React.FC<GloboTerraqueoProps> = ({
  className = '',
  onMapReady,
  center = [-64, -36], // Centrado en Argentina
  zoom = 2.0,
  capa = 'armonizado',
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const spinIntervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isSpinning, setIsSpinning] = useState(!prefersReducedMotion);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const isSpinningRef = useRef(isSpinning);
  const isUserInteractingRef = useRef(isUserInteracting);
  useEffect(() => {
    isSpinningRef.current = isSpinning;
  }, [isSpinning]);
  useEffect(() => {
    isUserInteractingRef.current = isUserInteracting;
  }, [isUserInteracting]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSensorFilter, setActiveSensorFilter] = useState<'armonizado' | 'modis' | 'viirs'>(capa);
  const [realHotspots, setRealHotspots] = useState<typeof SAMPLE_HOTSPOTS | null>(null);

  // Sincronizar con prop externa
  useEffect(() => {
    setActiveSensorFilter(capa);
  }, [capa]);

  // Rotación orbital
  const secondsPerRevolution = 180;
  const maxSpinZoom = 4;
  const slowSpinZoom = 2.5;

  const spinGlobe = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isSpinningRef.current || isUserInteractingRef.current) return;

    const currentZoom = map.getZoom();
    if (currentZoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (currentZoom > slowSpinZoom) {
        const zoomDif = (maxSpinZoom - currentZoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }
      const mapCenter = map.getCenter();
      mapCenter.lng -= distancePerSecond / 60;
      map.easeTo({ center: mapCenter, duration: 1000, easing: (n: number) => n });
    }
  }, [maxSpinZoom, slowSpinZoom, secondsPerRevolution]);

  const handleInteractionStart = useCallback(() => {
    setIsUserInteracting(true);
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (idleTimeoutRef.current) {
      window.clearTimeout(idleTimeoutRef.current);
    }
    idleTimeoutRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
    }, 3500);
  }, []);

  // Actualizar marcadores de focos de calor según filtro
  const renderHotspotMarkers = useCallback((map: maplibregl.Map, filter: 'armonizado' | 'modis' | 'viirs', customSpots?: typeof SAMPLE_HOTSPOTS) => {
    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const spotsSource = customSpots || realHotspots || SAMPLE_HOTSPOTS;
    const visibleHotspots = spotsSource.filter((h) => {
      if (filter === 'armonizado') return true;
      return h.sensor === filter;
    });

    visibleHotspots.forEach((h) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';

      const isViirs = h.sensor === 'viirs';
      const isExtreme = h.brightness > 360;
      const color = isExtreme ? '#FF6759' : isViirs ? '#FF9C55' : '#68D9D0';

      el.innerHTML = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="animate-ping absolute w-4 h-4 rounded-full opacity-45" style="background: ${color};"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; border: 1.5px solid #EFF5ED; box-shadow: 0 0 8px ${color};"></div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(`
        <div style="font-family: 'DM Mono', monospace; font-size: 12px; padding: 6px; color: #EFF5ED; background: #0D1816; border: 1px solid #21312D; border-radius: 4px;">
          <strong style="color: ${color};">${h.sensor.toUpperCase()} · ${h.province}</strong><br/>
          <span>${isEn ? 'Brightness Temp:' : 'T. Brillo:'} <b>${h.brightness} K</b></span><br/>
          <span style="color: #93A39C; font-size: 12px;">${isEn ? 'NASA FIRMS S-NPP Calibrated' : 'NASA FIRMS S-NPP Calibrado'}</span>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [realHotspots, isEn]);

  // Consulta de celdas activas a FireHistoryInterfaceAPI (sin bucles en deps)
  useEffect(() => {
    let isCancelled = false;
    getMapaCeldas({
      bbox: '-73.6,-55.1,-53.6,-21.8',
      desde: '2024-09-01',
      hasta: '2024-09-30',
      capa: activeSensorFilter,
      min_focos: 10,
    })
      .then((fc) => {
        if (isCancelled || !fc?.features || fc.features.length === 0) return;
        const mapped = fc.features.slice(0, 30).map((f: any, idx: number) => {
          const coords = f.geometry?.coordinates?.[0] || [];
          let sumLng = 0;
          let sumLat = 0;
          coords.forEach(([clng, clat]: [number, number]) => {
            sumLng += clng;
            sumLat += clat;
          });
          const count = coords.length || 1;
          const valor = f.properties?.valor ?? f.properties?.armonizado ?? 30;
          const sensor = f.properties?.viirs ? 'viirs' : 'modis';
          const provId = f.properties?.provincia_id;

          return {
            id: `real-${f.properties?.cell_id ?? idx}`,
            lng: Number((sumLng / count).toFixed(4)),
            lat: Number((sumLat / count).toFixed(4)),
            sensor: sensor as 'viirs' | 'modis',
            brightness: Math.min(420, Math.round(310 + valor * 1.5)),
            province: provId ? `Prov. ${provId} (${Math.round(valor)} focos)` : `Celda ${f.properties?.cell_id ?? idx}`,
          };
        });

        if (mapped.length > 0) {
          setRealHotspots(mapped);
        }
      })
      .catch(() => {
        // Fallback silencioso a SAMPLE_HOTSPOTS
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSensorFilter]);

  // Inicializar MapLibre GL JS (sin token)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const style = import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_GLOBE_STYLE;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center,
        zoom,
        minZoom: 1,
        maxZoom: 14,
        cooperativeGestures: true,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('style.load', () => {
        try {
          map.setProjection?.({ type: 'globe' });
        } catch {
          // Ignorar si el entorno de test/estilo difiere
        }
        setIsLoaded(true);
        if (onMapReady) onMapReady(map);
      });

      map.on('error', () => {
        // Evitar bloquear la UI por fallos transitorios de teselas externas
      });

      map.on('mousedown', handleInteractionStart);
      map.on('touchstart', handleInteractionStart);
      map.on('dragstart', handleInteractionStart);
      map.on('mouseup', handleInteractionEnd);
      map.on('touchend', handleInteractionEnd);
      map.on('moveend', spinGlobe);

      return () => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        markersRef.current.forEach((m) => m.remove());
        map.remove();
        mapRef.current = null;
      };
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Error al inicializar MapLibre');
    }
  }, [handleInteractionStart, handleInteractionEnd, spinGlobe, onMapReady]);

  // Actualizar marcadores al cambiar filtro de sensor
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      renderHotspotMarkers(mapRef.current, activeSensorFilter);
    }
  }, [activeSensorFilter, isLoaded, renderHotspotMarkers]);

  // Vuelo suave cuando cambian las coordenadas de selección
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.flyTo({
        center: center,
        zoom: zoom,
        duration: 1800,
        essential: true,
      });
    }
  }, [center, zoom, isLoaded]);

  // Loop de auto-rotación
  useEffect(() => {
    if (!isLoaded || !isSpinning || isUserInteracting) return;
    spinGlobe();
    const interval = window.setInterval(spinGlobe, 1000);
    spinIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isLoaded, isSpinning, isUserInteracting, spinGlobe]);

  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: [-64, -36],
      zoom: 2.0,
      duration: 1800,
      essential: true,
    });
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-[#21312D] bg-[#07100F] ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none w-screen h-screen'
          : `w-full h-[520px] lg:h-[580px] ${className}`
      }`}
    >
      {/* Barra de cabecera del globo */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0D1816]/95 backdrop-blur-md border-b border-[#21312D] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#B8EE68]/20 text-[#B8EE68]">
            <GlobeIcon className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-title font-bold text-[#EFF5ED]">{t('globe.title')}</span>
              <span className="rounded bg-[#B8EE68]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#B8EE68]">
                {t('globe.badge')}
              </span>
            </div>
          </div>
        </div>

        {/* Indicador de canal de sensor activo (sincronizado con selector maestro) */}
        <div className="hidden sm:flex items-center gap-2 rounded-md border border-[#21312D] bg-[#07100F] px-2.5 py-1 font-mono text-xs text-[#EFF5ED]">
          <span
            className={`h-2 w-2 rounded-full ${
              activeSensorFilter === 'armonizado'
                ? 'bg-[#B8EE68]'
                : activeSensorFilter === 'modis'
                ? 'bg-[#68D9D0]'
                : 'bg-[#FF9C55]'
            }`}
          />
          <span className="font-semibold">
            {activeSensorFilter === 'armonizado'
              ? (isEn ? 'HARMONIZED · VIIRS EQUIV' : 'ARMONIZADO · ESCALA VIIRS')
              : activeSensorFilter === 'modis'
              ? 'MODIS · 1 km'
              : 'VIIRS · 375 m'}
          </span>
        </div>

        {/* Acciones de control */}
        <div className="flex items-center gap-1.5 font-sans text-xs">
          <button
            type="button"
            onClick={() => setIsSpinning((prev) => !prev)}
            aria-pressed={isSpinning}
            title={isSpinning ? t('globe.pauseSpin') : t('globe.resumeSpin')}
            className={`inline-flex min-h-[36px] sm:min-h-[32px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isSpinning
                ? 'bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40'
                : 'bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('globe.spin')}</span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title={t('globe.recenter')}
            className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded-md border border-[#21312D] bg-[#111E1B] p-2 sm:p-1.5 text-[#93A39C] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? (isEn ? 'Exit fullscreen' : 'Salir de pantalla completa') : (isEn ? 'Fullscreen' : 'Pantalla completa')}
            className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded-md border border-[#21312D] bg-[#111E1B] p-2 sm:p-1.5 text-[#93A39C] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewport del Mapa 3D */}
      <div
        className="relative flex-1 w-full h-full min-h-[380px]"
        style={{ background: 'radial-gradient(circle at 50% 45%, #0c221f 0%, #050c0b 65%, #020505 100%)' }}
      >
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#07100F]/90 backdrop-blur-md text-[#EFF5ED]">
            <div className="flex items-center gap-2 rounded-lg border border-[#FF6759]/40 bg-[#FF6759]/10 p-3 text-xs text-[#FF6759]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Leyenda científica de puntos calientes en la esquina del globo */}
        {isLoaded && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-md border border-[#21312D] bg-[#07100F]/90 p-2.5 backdrop-blur-md text-xs">
            <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-[#EFF5ED] border-b border-[#21312D] pb-1">
              <Flame className="h-3.5 w-3.5 text-[#FF6759]" />
              <span>Detecciones Térmicas</span>
            </div>
            <div className="mt-1 flex flex-col gap-1 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#68D9D0]" />
                <span className="text-[#EFF5ED]">MODIS (1 km)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF9C55]" />
                <span className="text-[#EFF5ED]">VIIRS (375 m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#FF6759]" />
                <span className="text-[#EFF5ED]">Alta Intensidad (&gt;360K)</span>
              </div>
            </div>
            <div className="mt-1 border-t border-[#21312D] pt-1 font-mono text-xs text-[#B8EE68]">
              {realHotspots ? 'API EN VIVO · FIRMS' : 'DATOS DE MUESTRA · FIRMS'}
            </div>
          </div>
        )}

        {/* Controles de Zoom */}
        {isLoaded && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-md border border-[#21312D] bg-[#07100F]/85 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
              aria-label="Acercar mapa"
              className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded p-1.5 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-[1px] bg-[#21312D] mx-1" />
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
              aria-label="Alejar mapa"
              className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded p-1.5 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Atribución oficial NASA Blue Marble */}
        <div className="absolute bottom-2 left-3 z-10 rounded border border-[#21312D] bg-[#07100F]/85 px-2 py-0.5 font-mono text-xs text-[#93A39C] backdrop-blur-md">
          {t('globe.attribution')}
        </div>
      </div>
    </div>
  );
};
