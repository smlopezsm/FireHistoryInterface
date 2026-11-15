import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapaCeldas, rangoDelMes, useMetadata, useProvincias, type GeoJSON } from '../../api';

if (typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}
import {
  attachProvinciasLayer,
  PROVINCIAS_GEOJSON_URL,
  type ProvinciaFeatureProperties,
  type ProvinciasLayerController,
} from './provinciasLayer';
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
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Calendar,
  Layers,
} from 'lucide-react';

const shiftMonth = (ym: string, delta: number): string => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

const monthDiff = (fromYm: string, toYm: string): number => {
  const [fy, fm] = fromYm.split('-').map(Number);
  const [ty, tm] = toYm.split('-').map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm));
};

const isPointInRing = (lng: number, lat: number, ring: number[][]): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

const isPointInPolygonCoords = (lng: number, lat: number, rings: number[][][]): boolean => {
  if (!rings.length || !isPointInRing(lng, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (isPointInRing(lng, lat, rings[i])) return false;
  }
  return true;
};

const isPointInGeometry = (
  lng: number,
  lat: number,
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon
): boolean => {
  if (geometry.type === 'Polygon') {
    return isPointInPolygonCoords(lng, lat, geometry.coordinates);
  }
  return geometry.coordinates.some((poly) => isPointInPolygonCoords(lng, lat, poly));
};

// Estilo cartográfico oscuro científico (IGN Argentina Argenmap Oscuro), perspectiva 3D inclinada sobre Argentina
const DEFAULT_GLOBE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  projection: { type: 'mercator' },
  sky: {
    'sky-color': '#030807',
    'horizon-color': '#2B7A73',
    'fog-color': '#07100F',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 6, 0.25],
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
      paint: {
        'raster-brightness-min': 0.0,
        'raster-brightness-max': 0.82,
        'raster-contrast': 0.35,
        'raster-saturation': -0.35,
        'raster-hue-rotate': -15,
      },
    },
  ],
};

// Vista satelital global (Esri World Imagery), cobertura planetaria sin API key
const SATELLITE_GLOBE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  projection: { type: 'globe' },
  sky: {
    'sky-color': '#030807',
    'horizon-color': '#2B7A73',
    'fog-color': '#07100F',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.95, 5, 0.2],
  },
  sources: {
    'esri-world-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: 'esri-satellite-base',
      type: 'raster',
      source: 'esri-world-imagery',
    },
  ],
};

interface Hotspot {
  id: string;
  lng: number;
  lat: number;
  sensor: 'viirs' | 'modis';
  brightness: number;
  province: string;
}

interface GloboTerraqueoProps {
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  center?: [number, number];
  zoom?: number;
  bbox?: [number, number, number, number];
  capa?: 'armonizado' | 'modis' | 'viirs';
  month?: string;
  onMonthChange?: (month: string) => void;
  geometriaZona?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  selectedProvinciaId?: string;
  selectedProvinciaIds?: string[];
  onSelectProvincia?: (provinciaId: string | null) => void;
}

export const GloboTerraqueo: React.FC<GloboTerraqueoProps> = ({
  className = '',
  onMapReady,
  center = [-64, -36], // Centrado en Argentina
  zoom = 2.0,
  bbox = [-73.6, -55.1, -53.6, -21.8],
  capa = 'armonizado',
  month,
  onMonthChange,
  geometriaZona,
  selectedProvinciaId,
  selectedProvinciaIds,
  onSelectProvincia,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));
  const { data: metadata, error: metadataError } = useMetadata();
  const { data: apiProvincias } = useProvincias(true);
  const minMonth = metadata?.fecha_min?.slice(0, 7) || '2000-11';
  const maxMonth = metadata?.fecha_max?.slice(0, 7) || '2026-11';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const provinciasControllerRef = useRef<ProvinciasLayerController | null>(null);
  const provinciasGeoJSONRef = useRef<GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    ProvinciaFeatureProperties
  > | null>(null);
  const activeSelectedIds = selectedProvinciaIds ?? (selectedProvinciaId ? [selectedProvinciaId] : []);
  const selectedProvinciaIdsRef = useRef<string[]>(activeSelectedIds);
  selectedProvinciaIdsRef.current = activeSelectedIds;
  const onSelectProvinciaRef = useRef(onSelectProvincia);
  onSelectProvinciaRef.current = onSelectProvincia;
  const idleTimeoutRef = useRef<number | null>(null);
  const prevViewRef = useRef({ lng: center[0], lat: center[1], zoom });

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

  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handleToggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (typeof document !== 'undefined') {
      if (document.fullscreenElement === el) {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
        return;
      }
      if (!isFullscreen && el && typeof el.requestFullscreen === 'function') {
        el.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(() => setIsFullscreen((prev) => !prev));
        return;
      }
    }
    setIsFullscreen((prev) => !prev);
  }, [isFullscreen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement !== rootRef.current) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const raf = window.requestAnimationFrame(() => map.resize?.());
    const timer = window.setTimeout(() => map.resize?.(), 80);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [isFullscreen]);
  const [mapStyleMode, setMapStyleMode] = useState<'ign' | 'satellite'>('ign');
  const [revealSeed, setRevealSeed] = useState(0);
  const mapStyleModeRef = useRef<'ign' | 'satellite'>(mapStyleMode);
  useEffect(() => {
    mapStyleModeRef.current = mapStyleMode;
  }, [mapStyleMode]);

  const [activeSensorFilter, setActiveSensorFilter] = useState<'armonizado' | 'modis' | 'viirs'>(capa);
  const [localMonth, setLocalMonth] = useState<string | null>(null);
  const requestedMonth = month ?? localMonth ?? maxMonth;
  const selectedMonth = requestedMonth >= minMonth && requestedMonth <= maxMonth ? requestedMonth : maxMonth;
  const updateMonth = onMonthChange ?? setLocalMonth;
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(!onMonthChange && !prefersReducedMotion);
  const [isLoadingCells, setIsLoadingCells] = useState(false);
  const [cellsError, setCellsError] = useState(false);
  const [totalCellsCount, setTotalCellsCount] = useState<number | null>(null);
  const [realHotspots, setRealHotspots] = useState<Hotspot[]>([]);

  const totalMonths = monthDiff(minMonth, maxMonth);
  const currentMonthIdx = monthDiff(minMonth, selectedMonth);
  const cellsStatus = metadataError || cellsError
    ? (isEn ? 'Hot spots unavailable' : 'Focos no disponibles')
    : (isEn ? 'Loading hot spots…' : 'Cargando focos…');

  const selectMonth = (nextMonth: string) => {
    if (nextMonth < minMonth || nextMonth > maxMonth) return;
    setIsPlayingTimeline(false);
    updateMonth(nextMonth);
  };

  useEffect(() => {
    if (!isPlayingTimeline || !metadata || minMonth === maxMonth) return;
    const timer = window.setTimeout(() => {
      updateMonth(selectedMonth >= maxMonth ? minMonth : shiftMonth(selectedMonth, 1));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [isPlayingTimeline, metadata, selectedMonth, minMonth, maxMonth, updateMonth]);

  // Sincronizar con prop externa
  useEffect(() => {
    setActiveSensorFilter(capa);
  }, [capa]);

  // Rotación orbital (grados/segundo efectivos en ciclos de 1000 ms encadenados con moveend)
  const secondsPerRevolution = 150;
  const maxSpinZoom = 4;
  const slowSpinZoom = 2.5;

  const spinGlobe = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isSpinningRef.current || isUserInteractingRef.current) return;
    if (mapStyleModeRef.current !== 'satellite') return;

    const currentZoom = map.getZoom();
    if (currentZoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (currentZoom > slowSpinZoom) {
        const zoomDif = (maxSpinZoom - currentZoom) / (maxSpinZoom - slowSpinZoom);
        distancePerSecond *= zoomDif;
      }
      const mapCenter = map.getCenter();
      mapCenter.lng -= distancePerSecond;
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
  const renderHotspotMarkers = useCallback((map: maplibregl.Map) => {
    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    realHotspots.forEach((h, idx) => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';

      const isViirs = h.sensor === 'viirs';
      const isExtreme = h.brightness > 360;
      const color = isExtreme ? '#FF6759' : isViirs ? '#FF9C55' : '#68D9D0';
      const delayMs = Math.min(idx * 35, 1100);

      el.innerHTML = `
        <div class="hotspot-appear relative flex items-center justify-center cursor-pointer" style="animation-delay: ${delayMs}ms;">
          <div class="hotspot-halo absolute w-4 h-4 rounded-full" style="background: ${color}; animation-delay: ${delayMs}ms;"></div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}; border: 1.5px solid #EFF5ED; box-shadow: 0 0 8px ${color};"></div>
        </div>
      `;

      const coordsLabel = `${h.lat.toFixed(4)}, ${h.lng.toFixed(4)}`;
      const gmapsUrl = `https://www.google.com/maps?q=${h.lat.toFixed(4)},${h.lng.toFixed(4)}`;
      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(`
        <div style="font-family: 'DM Mono', monospace; font-size: 12px; padding: 6px; color: #EFF5ED; background: #0D1816; border: 1px solid #21312D; border-radius: 4px;">
          <strong style="color: ${color};">${h.sensor.toUpperCase()} · ${h.province}</strong><br/>
          <span>${isEn ? 'Brightness Temp:' : 'T. Brillo:'} <b>${h.brightness} K</b></span><br/>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 3px; color: #B8EE68; text-decoration: underline; font-size: 11px;">
            ${coordsLabel} · Google Maps ↗
          </a><br/>
          <span style="color: #93A39C; font-size: 11px;">${isEn ? 'S-NPP Calibrated' : 'S-NPP Calibrado'}</span>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .setPopup(popup)
        .addTo(map);

      let closeTimer: number | null = null;
      const cancelClose = () => {
        if (closeTimer !== null) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
      };
      const scheduleClose = () => {
        cancelClose();
        closeTimer = window.setTimeout(() => {
          popup.remove?.();
        }, 140);
      };

      el.addEventListener('mouseenter', () => {
        cancelClose();
        popup.setLngLat([h.lng, h.lat]).addTo(map);
        const popupEl = popup.getElement?.();
        if (popupEl && !popupEl.dataset.hoverBound) {
          popupEl.dataset.hoverBound = '1';
          popupEl.addEventListener('mouseenter', cancelClose);
          popupEl.addEventListener('mouseleave', scheduleClose);
        }
      });

      el.addEventListener('mouseleave', scheduleClose);

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        cancelClose();
      });

      markersRef.current.push(marker);
    });
  }, [realHotspots, isEn]);

  const bboxParam = bbox.join(',');

  // Consulta de celdas activas a FireHistoryInterfaceAPI para el mes y zona seleccionados
  useEffect(() => {
    if (!metadata) return;
    let isCancelled = false;
    const { desde, hasta } = rangoDelMes(selectedMonth, metadata.fecha_min, metadata.fecha_max);
    setIsLoadingCells(true);
    setCellsError(false);
    setTotalCellsCount(null);
    setRealHotspots([]);

    getMapaCeldas({
      bbox: bboxParam,
      desde,
      hasta,
      capa: activeSensorFilter,
      min_focos: 5,
    })
      .then((fc) => {
        if (isCancelled) return;
        const features = selectedProvinciaId
          ? fc.features.filter(({ properties }) => properties.provincia_id === selectedProvinciaId)
          : fc.features;

        const mappedAll = features.map((f) => {
          const coords = f.geometry?.coordinates?.[0] || [];
          let sumLng = 0;
          let sumLat = 0;
          coords.forEach(([clng, clat]) => {
            sumLng += clng;
            sumLat += clat;
          });
          const count = coords.length || 1;
          const { cell_id, provincia_id, viirs, valor } = f.properties;
          const sensor = activeSensorFilter === 'armonizado' ? (viirs ? 'viirs' : 'modis') : activeSensorFilter;

          return {
            id: `real-${cell_id}`,
            lng: Number((sumLng / count).toFixed(4)),
            lat: Number((sumLat / count).toFixed(4)),
            sensor,
            brightness: Math.min(420, Math.round(310 + valor * 1.5)),
            valor,
            province: provincia_id ? `Prov. ${provincia_id} (${Math.round(valor)} focos)` : `Celda ${cell_id}`,
          };
        });

        const scoped = geometriaZona
          ? mappedAll.filter((spot) => isPointInGeometry(spot.lng, spot.lat, geometriaZona))
          : mappedAll;

        setTotalCellsCount(scoped.length);

        const topSpots = [...scoped]
          .sort((a, b) => b.valor - a.valor)
          .slice(0, 60)
          .map(({ valor: _v, ...spot }) => spot);

        setRealHotspots(topSpots);
      })
      .catch(() => {
        if (!isCancelled) {
          setCellsError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingCells(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeSensorFilter, selectedMonth, bboxParam, metadata, geometriaZona, selectedProvinciaId]);

  // Inicializar MapLibre GL JS (sin token)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const style = import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_GLOBE_STYLE;
      const initialZoom = zoom === 2.0 ? 3.5 : zoom;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center,
        zoom: initialZoom,
        pitch: 42,
        bearing: -10,
        minZoom: 1,
        maxZoom: 14,
        cooperativeGestures: false,
        dragPan: true,
        dragRotate: true,
        scrollZoom: true,
        touchZoomRotate: true,
        attributionControl: false,
      });

      mapRef.current = map;

      map.on('style.load', () => {
        try {
          const projectionType = mapStyleModeRef.current === 'satellite' ? 'globe' : 'mercator';
          map.setProjection?.({ type: projectionType });
        } catch {
          // Ignorar si el entorno de test/estilo difiere
        }

        if (!provinciasControllerRef.current) {
          provinciasControllerRef.current = attachProvinciasLayer(map, {
            onSelectProvincia: (pid) => onSelectProvinciaRef.current?.(pid),
          });
        } else {
          provinciasControllerRef.current.ensureLayers();
        }

        if (provinciasGeoJSONRef.current) {
          provinciasControllerRef.current.setGeoJSON(provinciasGeoJSONRef.current);
          provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
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
      map.on('click', (e: maplibregl.MapMouseEvent) => {
        const target = e.originalEvent?.target as HTMLElement | null;
        if (target?.closest?.('.hotspot-marker')) return;

        isSpinningRef.current = false;
        setIsSpinning(false);
        map.stop?.();

        const currentPitch = map.getPitch?.() ?? 0;
        const currentBearing = map.getBearing?.() ?? 0;
        if (currentPitch > 1 || Math.abs(currentBearing) > 1) {
          map.easeTo({
            center: e.lngLat ? [e.lngLat.lng, e.lngLat.lat] : map.getCenter(),
            zoom: Math.max(map.getZoom(), 4.2),
            pitch: 0,
            bearing: 0,
            duration: 600,
            essential: true,
          });
        }
      });

      return () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        provinciasControllerRef.current?.destroy();
        provinciasControllerRef.current = null;
        markersRef.current.forEach((m) => m.remove());
        map.remove();
        mapRef.current = null;
      };
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Error al inicializar MapLibre');
    }
  }, [handleInteractionStart, handleInteractionEnd, spinGlobe, onMapReady]);

  // Cargar geometrías de provincias desde el backend local (con fallback al GeoJSON estático)
  useEffect(() => {
    if (!isLoaded || !provinciasControllerRef.current) return;

    const apiFeatures = (apiProvincias ?? [])
      .filter((p) => Boolean(p.geometria && p.geometria.type))
      .map((p) => ({
        type: 'Feature' as const,
        geometry: p.geometria as GeoJSON.Geometry,
        properties: {
          provincia_id: p.provincia_id,
          nombre: p.nombre,
        },
      }));

    if (apiFeatures.length > 0) {
      const fc: GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinciaFeatureProperties> = {
        type: 'FeatureCollection',
        features: apiFeatures,
      };
      provinciasGeoJSONRef.current = fc;
      provinciasControllerRef.current.setGeoJSON(fc);
      provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
      return;
    }

    if (provinciasGeoJSONRef.current) {
      provinciasControllerRef.current.setGeoJSON(provinciasGeoJSONRef.current);
      provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
      return;
    }

    const controller = new AbortController();
    fetch(PROVINCIAS_GEOJSON_URL, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.type !== 'FeatureCollection' || !provinciasControllerRef.current) return;
        provinciasGeoJSONRef.current = data;
        provinciasControllerRef.current.setGeoJSON(data);
        provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
      })
      .catch(() => {
        // Silencioso en entornos sin red o tests jsdom
      });

    return () => controller.abort();
  }, [isLoaded, apiProvincias]);

  // Sincronizar selección externa (provincia o región) con el estado GPU del mapa
  const selectedIdsKey = activeSelectedIds.join(',');
  useEffect(() => {
    if (!isLoaded || !provinciasControllerRef.current) return;
    provinciasControllerRef.current.setSelectedProvincias(activeSelectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdsKey, isLoaded]);

  // Actualizar marcadores al cambiar filtro de sensor o reiniciar animación
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      renderHotspotMarkers(mapRef.current);
    }
  }, [isLoaded, revealSeed, renderHotspotMarkers]);

  // Vuelo suave cuando cambian las coordenadas de selección externa
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const prev = prevViewRef.current;
    if (prev.lng === center[0] && prev.lat === center[1] && prev.zoom === zoom) return;
    prevViewRef.current = { lng: center[0], lat: center[1], zoom };
    const isSat = mapStyleModeRef.current === 'satellite';
    mapRef.current.flyTo({
      center,
      zoom: !isSat && zoom === 2.0 ? 3.5 : zoom,
      pitch: isSat ? 0 : 42,
      duration: 1500,
      essential: true,
    });
  }, [center, zoom, isLoaded]);

  // Loop de auto-rotación encadenado con moveend (sin setInterval duplicado)
  useEffect(() => {
    if (!isLoaded || !isSpinning || isUserInteracting) {
      mapRef.current?.stop?.();
      return;
    }
    spinGlobe();
  }, [isLoaded, isSpinning, isUserInteracting, spinGlobe]);

  const handleToggleStyle = () => {
    const nextMode = mapStyleMode === 'ign' ? 'satellite' : 'ign';
    setMapStyleMode(nextMode);
    mapStyleModeRef.current = nextMode;
    const map = mapRef.current;
    if (!map) return;

    const nextStyle = nextMode === 'satellite' ? SATELLITE_GLOBE_STYLE : DEFAULT_GLOBE_STYLE;
    map.setStyle?.(nextStyle);
    if (nextMode === 'satellite') {
      const shouldSpin = !prefersReducedMotion;
      isSpinningRef.current = shouldSpin;
      setIsSpinning(shouldSpin);
      map.setProjection?.({ type: 'globe' });
      map.flyTo({ center: [-64, -36], zoom: 2.2, pitch: 0, bearing: 0, duration: 1200, essential: true });
    } else {
      isSpinningRef.current = false;
      setIsSpinning(false);
      map.stop?.();
      setRevealSeed((s) => s + 1);
      map.setProjection?.({ type: 'mercator' });
      map.flyTo({ center: [-64, -36], zoom: 3.5, pitch: 42, bearing: -10, duration: 1200, essential: true });
    }
  };

  const handleResetView = () => {
    const isSat = mapStyleModeRef.current === 'satellite';
    mapRef.current?.flyTo({
      center: [-64, -36],
      zoom: isSat ? 2.2 : 3.5,
      pitch: isSat ? 0 : 42,
      bearing: isSat ? 0 : -10,
      duration: 1800,
      essential: true,
    });
  };

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col rounded-xl overflow-hidden border border-[#21312D] bg-[#07100F] ${
        isFullscreen
          ? 'fixed inset-0 z-[100] rounded-none w-screen h-screen'
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
            onClick={handleToggleStyle}
            aria-pressed={mapStyleMode === 'satellite'}
            title={mapStyleMode === 'satellite' ? (isEn ? 'Switch to dark IGN map' : 'Cambiar a mapa oscuro IGN') : (isEn ? 'Switch to satellite view' : 'Cambiar a vista satelital')}
            className={`inline-flex min-h-[36px] sm:min-h-[32px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mapStyleMode === 'satellite'
                ? 'bg-[#68D9D0]/20 text-[#68D9D0] border border-[#68D9D0]/40'
                : 'bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{mapStyleMode === 'satellite' ? (isEn ? 'IGN Dark' : 'IGN Oscuro') : (isEn ? 'Satellite' : 'Satélite')}</span>
          </button>

          {mapStyleMode === 'satellite' ? (
            <button
              type="button"
              onClick={() => {
                setIsSpinning((prev) => {
                  const next = !prev;
                  isSpinningRef.current = next;
                  if (!next) mapRef.current?.stop?.();
                  return next;
                });
              }}
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
          ) : (
            <button
              type="button"
              onClick={() => setRevealSeed((s) => s + 1)}
              title={isEn ? 'Replay gradual hotspot reveal' : 'Reproducir aparición gradual de focos'}
              className="inline-flex min-h-[36px] sm:min-h-[32px] items-center gap-1.5 rounded-md border border-[#B8EE68]/40 bg-[#B8EE68]/15 px-2.5 py-1 text-xs font-medium text-[#B8EE68] transition-colors hover:bg-[#B8EE68]/25"
            >
              <Flame className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isEn ? 'Reveal' : 'Animar'}</span>
            </button>
          )}

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
            onClick={handleToggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? (isEn ? 'Exit fullscreen' : 'Salir de pantalla completa') : (isEn ? 'Fullscreen' : 'Pantalla completa')}
            title={isFullscreen ? (isEn ? 'Exit fullscreen' : 'Salir de pantalla completa') : (isEn ? 'Fullscreen' : 'Pantalla completa')}
            className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded-md border border-[#21312D] bg-[#111E1B] p-2 sm:p-1.5 text-[#93A39C] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Barra de navegación temporal histórica */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#07100F] border-b border-[#21312D] text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#93A39C]">
          <Calendar className="h-3.5 w-3.5 text-[#B8EE68]" />
          <span className="hidden sm:inline">{isEn ? 'Period:' : 'Período:'}</span>
          <button
            type="button"
            disabled={selectedMonth <= minMonth}
            onClick={() => selectMonth(shiftMonth(selectedMonth, -1))}
            aria-label={isEn ? 'Previous month' : 'Mes anterior'}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <input
            type="month"
            min={minMonth}
            max={maxMonth}
            value={selectedMonth}
            onChange={(e) => selectMonth(e.target.value)}
            aria-label={isEn ? 'Select historical month' : 'Seleccionar mes histórico'}
            className="h-7 rounded border border-[#21312D] bg-[#111E1B] px-2 text-xs text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none [color-scheme:dark]"
          />
          <button
            type="button"
            disabled={selectedMonth >= maxMonth}
            onClick={() => selectMonth(shiftMonth(selectedMonth, 1))}
            aria-label={isEn ? 'Next month' : 'Mes siguiente'}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={totalMonths}
          value={currentMonthIdx}
          onChange={(e) => selectMonth(shiftMonth(minMonth, Number(e.target.value)))}
          aria-label={isEn ? 'Timeline slider' : 'Deslizador temporal'}
          className="h-1.5 flex-1 min-w-[110px] cursor-pointer accent-[#B8EE68]"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlayingTimeline((p) => !p)}
            aria-pressed={isPlayingTimeline}
            className={`inline-flex h-7 items-center gap-1 rounded border px-2.5 text-xs font-medium transition-colors ${
              isPlayingTimeline
                ? 'border-[#B8EE68]/50 bg-[#B8EE68]/20 text-[#B8EE68]'
                : 'border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/40'
            }`}
          >
            {isPlayingTimeline ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{isPlayingTimeline ? (isEn ? 'Pause' : 'Pausar') : (isEn ? 'Timelapse' : 'Recorrer')}</span>
          </button>
          <span
            role="status"
            className={`min-w-[148px] text-center tabular-nums rounded border border-[#21312D] bg-[#0D1816] px-2 py-0.5 text-xs text-[#B8EE68] transition-opacity duration-200 ${
              isLoadingCells ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {totalCellsCount !== null
              ? `${totalCellsCount} ${isEn ? 'cells' : 'celdas'} · ${selectedMonth}`
              : cellsStatus}
          </span>
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
              <span>{isEn ? 'Thermal Detections' : 'Detecciones Térmicas'}</span>
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
                <span className="text-[#EFF5ED]">{isEn ? 'High Intensity (>360K)' : 'Alta Intensidad (>360K)'}</span>
              </div>
            </div>
            <div className="mt-1 border-t border-[#21312D] pt-1 font-mono text-xs text-[#B8EE68]">
              {totalCellsCount !== null ? (isEn ? 'LIVE API' : 'API EN VIVO') : cellsStatus}
            </div>
          </div>
        )}

        {/* Controles de Zoom */}
        {isLoaded && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 rounded-md border border-[#21312D] bg-[#07100F]/85 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
              aria-label={isEn ? 'Zoom in' : 'Acercar mapa'}
              className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded p-1.5 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <div className="h-[1px] bg-[#21312D] mx-1" />
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
              aria-label={isEn ? 'Zoom out' : 'Alejar mapa'}
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
