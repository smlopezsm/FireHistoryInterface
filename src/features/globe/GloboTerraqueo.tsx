import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  RotateCw,
  RefreshCw,
  Maximize2,
  Minimize2,
  Key,
  Globe as GlobeIcon,
  Plus,
  Minus,
  AlertCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';

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
  onMapReady?: (map: mapboxgl.Map) => void;
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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const spinIntervalRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);

  const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const isEnvTokenValid = Boolean(envToken && !envToken.includes('tu_mapbox_access_token'));

  const [activeToken, setActiveToken] = useState<string>(isEnvTokenValid ? envToken! : '');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(!isEnvTokenValid);

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(true);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSensorFilter, setActiveSensorFilter] = useState<'armonizado' | 'modis' | 'viirs'>(capa);

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
    if (!map || !isSpinning || isUserInteracting) return;

    const currentZoom = map.getZoom();
    if (currentZoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (currentZoom > slowSpinZoom) {
        const zoomDif = (maxSpinZoom - currentZoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }
      const mapCenter = map.getCenter();
      mapCenter.lng -= distancePerSecond / 60;
      map.easeTo({ center: mapCenter, duration: 1000, easing: (n) => n });
    }
  }, [isSpinning, isUserInteracting, maxSpinZoom, slowSpinZoom, secondsPerRevolution]);

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
  const renderHotspotMarkers = useCallback((map: mapboxgl.Map, filter: 'armonizado' | 'modis' | 'viirs') => {
    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const visibleHotspots = SAMPLE_HOTSPOTS.filter((h) => {
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
        <div style="position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; border: 1.5px solid #EFF5ED; box-shadow: 0 0 8px ${color};"></div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(`
        <div style="font-family: 'DM Mono', monospace; font-size: 12px; padding: 6px; color: #EFF5ED; background: #0D1816; border: 1px solid #21312D; border-radius: 4px;">
          <strong style="color: ${color};">${h.sensor.toUpperCase()} · ${h.province}</strong><br/>
          <span>${isEn ? 'Brightness Temp:' : 'T. Brillo:'} <b>${h.brightness} K</b></span><br/>
          <span style="color: #93A39C; font-size: 12px;">${isEn ? 'NASA FIRMS S-NPP Calibrated' : 'NASA FIRMS S-NPP Calibrado'}</span>
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, []);

  // Inicializar Mapbox GL JS
  useEffect(() => {
    if (!mapContainerRef.current || !activeToken) return;

    try {
      mapboxgl.accessToken = activeToken;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/standard-satellite',
        projection: { name: 'globe' },
        center: center,
        zoom: zoom,
        minZoom: 1,
        maxZoom: 14,
        antialias: true,
      });

      mapRef.current = map;

      map.on('style.load', () => {
        try {
          map.setFog({
            color: 'rgb(7, 16, 15)', // Fondo base #07100F
            'high-color': 'rgb(104, 217, 208)', // Resplandor cian sutil
            'horizon-blend': 0.08,
            'space-color': 'rgb(4, 8, 8)',
            'star-intensity': 0.7,
          });
        } catch {
          // Ignorar si el estilo difiere
        }
        setIsLoaded(true);
        renderHotspotMarkers(map, activeSensorFilter);
        if (onMapReady) onMapReady(map);
      });

      map.on('error', (e) => {
        if (e.error?.message?.includes('Forbidden') || e.error?.message?.includes('Unauthorized')) {
          setHasError(true);
          setErrorMessage('Token de Mapbox no válido o sin acceso a standard-satellite.');
        }
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
      setErrorMessage(err instanceof Error ? err.message : 'Error al inicializar Mapbox');
    }
  }, [activeToken, handleInteractionStart, handleInteractionEnd, spinGlobe, onMapReady]);

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

  const handleApplyManualToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTokenInput.trim()) {
      setActiveToken(manualTokenInput.trim());
      setShowTokenPrompt(false);
      setHasError(false);
    }
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSpinning((prev) => !prev)}
            aria-pressed={isSpinning}
            title={isSpinning ? t('globe.pauseSpin') : t('globe.resumeSpin')}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-mono transition-colors ${
              isSpinning
                ? 'bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40'
                : 'bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]'
            }`}
          >
            <RotateCw className="h-3 w-3" />
            <span className="hidden sm:inline">{t('globe.spin')}</span>
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title={t('globe.recenter')}
            className="rounded-md border border-[#21312D] bg-[#111E1B] p-1 text-[#93A39C] hover:text-[#EFF5ED]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? (isEn ? 'Exit fullscreen' : 'Salir de pantalla completa') : (isEn ? 'Fullscreen' : 'Pantalla completa')}
            className="rounded-md border border-[#21312D] bg-[#111E1B] p-1 text-[#93A39C] hover:text-[#EFF5ED]"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewport del Mapa 3D */}
      <div className="relative flex-1 w-full h-full min-h-[380px] bg-[#050C0B]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Modal de configuración de Token si está ausente */}
        {(!activeToken || showTokenPrompt || hasError) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#07100F]/95 backdrop-blur-md text-[#EFF5ED]">
            <div className="w-full max-w-md rounded-xl border border-[#21312D] bg-[#0D1816] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B8EE68]/20 text-[#B8EE68] mb-3">
                <Key className="h-6 w-6" />
              </div>

              <h3 className="font-title text-base font-bold text-[#EFF5ED]">{t('globe.tokenTitle')}</h3>
              <p className="mt-2 text-xs text-[#93A39C] leading-relaxed">
                {t('globe.tokenDesc')}
              </p>

              {hasError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#FF6759]/40 bg-[#FF6759]/10 p-2.5 text-left text-xs text-[#FF6759]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleApplyManualToken} className="mt-4 flex flex-col gap-2.5">
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="pk.eyJ1Ijoi..."
                  className="w-full rounded-lg border border-[#21312D] bg-[#07100F] px-3 py-2 font-mono text-xs text-[#EFF5ED] placeholder-[#93A39C]/60 focus:border-[#B8EE68] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualTokenInput.trim()}
                  className="rounded-lg bg-[#B8EE68] px-4 py-2 font-mono text-xs font-bold text-[#07100F] transition-colors hover:bg-[#cbf58c] disabled:opacity-50"
                >
                  {t('globe.initBtn')}
                </button>
              </form>

              <div className="mt-4 border-t border-[#21312D] pt-3 text-xs text-[#93A39C] flex items-center justify-between">
                <span>{t('globe.noToken')}</span>
                <a
                  href="https://account.mapbox.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#B8EE68] hover:underline"
                >
                  <span>{t('globe.freeAccount')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda científica de puntos calientes en la esquina del globo */}
        {activeToken && isLoaded && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 rounded-md border border-[#21312D] bg-[#07100F]/90 p-2.5 backdrop-blur-md text-xs">
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#93A39C] border-b border-[#21312D] pb-1">
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
              DATOS DE MUESTRA · FIRMS
            </div>
          </div>
        )}

        {/* Controles de Zoom */}
        {activeToken && isLoaded && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-md border border-[#21312D] bg-[#07100F]/85 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
              aria-label="Acercar mapa"
              className="rounded p-1.5 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-[1px] bg-[#21312D] mx-1" />
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
              aria-label="Alejar mapa"
              className="rounded p-1.5 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED]"
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
