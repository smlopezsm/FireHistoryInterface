import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatMes } from '../../i18n/formatMes';
import { ApiRequestError, BBOX_ARGENTINA, rangoDelMes, useMapaCeldas, useMetadata, useProvincias, type GeoJSON, type BBox } from '../../api';
import {
  MIN_FOCOS_MAPA,
  TRAMOS_FOCOS,
  celdasParaMapa,
  etiquetaTramo,
  popupCeldaHtml,
  textoContador,
  type CeldaMapa,
} from './celdasMapa';
import { ID_CELDAS, celdaEnPunto, dibujarCeldas } from './celdasLayer';

if (typeof maplibregl.setWorkerUrl === 'function') {
  maplibregl.setWorkerUrl(maplibreWorkerUrl);
}
import {
  attachProvinciasLayer,
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
  Layers,
} from 'lucide-react';

const shiftMonth = (ym: string, delta: number): string => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
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

const ID_LIMITES = 'zona-coordenadas';

function mostrarRectangulo(map: maplibregl.Map, limites: BBox | null) {
  const source = map.getSource<maplibregl.GeoJSONSource>(ID_LIMITES);
  if (!limites) {
    if (source) {
      map.removeLayer(ID_LIMITES);
      map.removeSource(ID_LIMITES);
    }
    return;
  }
  const [oeste, sur, este, norte] = limites;
  const data: Parameters<maplibregl.GeoJSONSource['setData']>[0] = {
    type: 'Polygon',
    coordinates: [[[oeste, sur], [este, sur], [este, norte], [oeste, norte], [oeste, sur]]],
  };
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(ID_LIMITES, { type: 'geojson', data });
  map.addLayer({
    id: ID_LIMITES,
    type: 'line',
    source: ID_LIMITES,
    paint: { 'line-color': '#B8EE68', 'line-width': 2.5, 'line-opacity': 0.95 },
  });
}

const HISTORICAL_RASTER = 'historical-burned-area';

function mostrarCapaHistorica(map: maplibregl.Map, tiles: string | undefined, bounds: BBox) {
  const source = map.getSource(HISTORICAL_RASTER);
  if (source && !tiles) {
    map.removeLayer(HISTORICAL_RASTER);
    map.removeSource(HISTORICAL_RASTER);
  }
  if (!tiles || source) return;
  map.addSource(HISTORICAL_RASTER, { type: 'raster', tiles: [tiles], tileSize: 256, bounds });
  map.addLayer({
    id: HISTORICAL_RASTER,
    type: 'raster',
    source: HISTORICAL_RASTER,
    paint: { 'raster-opacity': 0.8, 'raster-resampling': 'nearest' },
  }, map.getLayer(ID_CELDAS) ? ID_CELDAS : undefined);
}

interface GloboTerraqueoProps {
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  center?: [number, number];
  zoom?: number;
  bbox?: BBox;
  mostrarLimites?: boolean;
  onInspectCell?: () => void;
  historicalRasterTiles?: string;
  historicalRasterSource?: string;
  historicalRasterBounds?: BBox;
  mesDesde?: string;
  mesHasta?: string;
  capa?: 'armonizado' | 'modis' | 'viirs';
  month?: string;
  onMonthChange?: (month: string) => void;
  geometriaZona?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  selectedProvinciaId?: string;
  selectedProvinciaIds?: string[];
  onSelectProvincia?: (provinciaId: string | null) => void;
}

export const GloboTerraqueo: React.FC<GloboTerraqueoProps> = ({
  className = 'h-[520px] lg:h-[580px]',
  onMapReady,
  center = [-64, -36], // Centrado en Argentina
  zoom = 2.0,
  bbox = BBOX_ARGENTINA,
  mostrarLimites = false,
  onInspectCell,
  historicalRasterTiles,
  historicalRasterSource,
  historicalRasterBounds,
  mesDesde,
  mesHasta,
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
  const nombresProvincias = useMemo(
    () => new Map((apiProvincias ?? []).map((p) => [p.provincia_id, p.nombre] as [string, string])),
    [apiProvincias]
  );
  const minMonth = metadata ? mesDesde ?? metadata.fecha_min.slice(0, 7) : undefined;
  const maxMonth = metadata ? mesHasta ?? metadata.fecha_max.slice(0, 7) : undefined;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const limites = mostrarLimites ? bbox : null;
  const limitesRef = useRef(limites);
  limitesRef.current = limites;
  const rasterHistoricoRef = useRef({ tiles: historicalRasterTiles, bounds: historicalRasterBounds ?? bbox });
  rasterHistoricoRef.current = { tiles: historicalRasterTiles, bounds: historicalRasterBounds ?? bbox };
  const [rasterHistoricoEstado, setRasterHistoricoEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const estiloListoRef = useRef(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
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
  const [isSpinning, setIsSpinning] = useState(false);
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
  const mapStyleModeRef = useRef<'ign' | 'satellite'>(mapStyleMode);
  useEffect(() => {
    mapStyleModeRef.current = mapStyleMode;
  }, [mapStyleMode]);

  const [localMonth, setLocalMonth] = useState<string | null>(null);
  const requestedMonth = month ?? localMonth ?? maxMonth;
  const selectedMonth = requestedMonth && minMonth && maxMonth &&
    requestedMonth >= minMonth && requestedMonth <= maxMonth ? requestedMonth : maxMonth;
  const updateMonth = onMonthChange ?? setLocalMonth;
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const mesEnReproduccion = useRef<string>();
  // Celdas del mes con TanStack Query: caché por mes/zona/capa y cancelación de lo obsoleto.
  const bboxParam = bbox.join(',');
  const paramsCeldas = useMemo(() => {
    if (!metadata || !selectedMonth) return null;
    const { desde, hasta } = rangoDelMes(selectedMonth, metadata.fecha_min, metadata.fecha_max);
    return { bbox: bboxParam, desde, hasta, capa, min_focos: MIN_FOCOS_MAPA };
  }, [metadata, selectedMonth, bboxParam, capa]);
  const celdas = useMapaCeldas(paramsCeldas);
  const isLoadingCells = celdas.isFetching;
  const cellsError = celdas.isError;
  const celdasVisibles = useMemo(
    () => celdasParaMapa(celdas.data?.features ?? [], {
      capa,
      provinciaId: selectedProvinciaId,
      provinciaIds: selectedProvinciaId ? undefined : selectedProvinciaIds,
      dentro: geometriaZona ? (lng, lat) => isPointInGeometry(lng, lat, geometriaZona) : undefined,
      nombres: nombresProvincias,
    }),
    [celdas.data, capa, selectedProvinciaId, selectedProvinciaIds, geometriaZona, nombresProvincias],
  );
  const opcionesCeldasRef = useRef({ celdasVisibles, capa, isEn, onInspectCell });
  opcionesCeldasRef.current = { celdasVisibles, capa, isEn, onInspectCell };

  const demasiadasCeldas = celdas.error instanceof ApiRequestError && celdas.error.status === 413;
  const cellsStatus = demasiadasCeldas
    ? (isEn ? 'Choose a smaller area' : 'Elegí una zona más chica')
    : metadataError || cellsError
      ? (isEn ? 'Hot spots unavailable' : 'Focos no disponibles')
      : (isEn ? 'Loading hot spots…' : 'Cargando focos…');

  const selectMonth = (nextMonth: string) => {
    if (!minMonth || !maxMonth || nextMonth < minMonth || nextMonth > maxMonth) return;
    setIsPlayingTimeline(false);
    updateMonth(nextMonth);
  };

  const alternarReproduccion = () => {
    if (!minMonth || !maxMonth || !selectedMonth || minMonth === maxMonth) return;
    if (isPlayingTimeline) {
      setIsPlayingTimeline(false);
      return;
    }
    const inicio = selectedMonth === maxMonth ? minMonth : selectedMonth;
    mesEnReproduccion.current = inicio;
    if (inicio !== selectedMonth) updateMonth(inicio);
    setIsPlayingTimeline(true);
  };

  const idsZona = activeSelectedIds.join(',');
  useEffect(() => {
    setIsPlayingTimeline(false);
  }, [bboxParam, idsZona, capa, minMonth, maxMonth]);

  useEffect(() => {
    if (!isPlayingTimeline || !selectedMonth || !maxMonth) return;
    if (mesEnReproduccion.current !== selectedMonth || selectedMonth >= maxMonth || cellsError) {
      setIsPlayingTimeline(false);
      return;
    }
    if (!isLoaded || isLoadingCells || !celdas.data) return;
    const timer = window.setTimeout(() => {
      const siguiente = shiftMonth(selectedMonth, 1);
      mesEnReproduccion.current = siguiente;
      updateMonth(siguiente);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [isPlayingTimeline, isLoaded, isLoadingCells, cellsError, celdas.data, selectedMonth, maxMonth, updateMonth]);

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

  const abrirDetalleCelda = useCallback((map: maplibregl.Map, detalle: CeldaMapa['properties'], posicion: maplibregl.LngLatLike) => {
    const { capa: actual, isEn: enIngles, onInspectCell: avisar } = opcionesCeldasRef.current;
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup()
      .setLngLat(posicion)
      .setHTML(popupCeldaHtml(detalle, { capa: actual, isEn: enIngles }))
      .addTo(map);
    avisar?.();
  }, []);

  const abrirCeldaEjemplo = () => {
    const map = mapRef.current;
    if (!map || !celdasVisibles.length) return;
    const { properties: celda } = celdasVisibles.reduce((mayor, item) =>
      item.properties.valor > mayor.properties.valor ? item : mayor,
    );
    const posicion: [number, number] = [celda.lng, celda.lat];
    map.jumpTo({ center: posicion });
    abrirDetalleCelda(map, celda, posicion);
  };

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
        trackResize: true,
      });

      mapRef.current = map;

      map.on('style.load', () => {
        estiloListoRef.current = true;
        try {
          const projectionType = mapStyleModeRef.current === 'satellite' ? 'globe' : 'mercator';
          map.setProjection?.({ type: projectionType });
        } catch {
          // Ignorar si el entorno de test/estilo difiere
        }

        if (!provinciasControllerRef.current) {
          provinciasControllerRef.current = attachProvinciasLayer(map, {
            onSelectProvincia: (pid) => onSelectProvinciaRef.current?.(pid),
            sobreCelda: ({ point }) => celdaEnPunto(map, point) !== undefined,
          });
        } else {
          provinciasControllerRef.current.ensureLayers();
        }

        if (provinciasGeoJSONRef.current) {
          provinciasControllerRef.current.setGeoJSON(provinciasGeoJSONRef.current);
          provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
        }

        const historica = rasterHistoricoRef.current;
        if (historica.tiles) mostrarCapaHistorica(map, historica.tiles, historica.bounds);
        dibujarCeldas(map, opcionesCeldasRef.current.celdasVisibles);
        if (limitesRef.current) mostrarRectangulo(map, limitesRef.current);
        setIsLoaded(true);
        if (onMapReady) onMapReady(map);
      });

      map.on('sourcedata', (evento) => {
        if (evento.sourceId === HISTORICAL_RASTER && evento.sourceDataType === 'content' && evento.isSourceLoaded) {
          setRasterHistoricoEstado((estado) => estado === 'error' ? estado : 'listo');
        }
      });
      map.on('error', (evento) => {
        if ('sourceId' in evento && evento.sourceId === HISTORICAL_RASTER) setRasterHistoricoEstado('error');
      });

      map.on('mousedown', handleInteractionStart);
      map.on('touchstart', handleInteractionStart);
      map.on('dragstart', handleInteractionStart);
      map.on('mouseup', handleInteractionEnd);
      map.on('touchend', handleInteractionEnd);
      map.on('moveend', spinGlobe);
      map.on('click', (e: maplibregl.MapMouseEvent) => {
        const celdaId = celdaEnPunto(map, e.point);
        if (celdaId !== undefined) {
          const detalle = opcionesCeldasRef.current.celdasVisibles.find((feature) => feature.id === celdaId)?.properties;
          if (detalle) abrirDetalleCelda(map, detalle, e.lngLat);
          return;
        }

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
          });
        }
      });

      return () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        provinciasControllerRef.current?.destroy();
        provinciasControllerRef.current = null;
        popupRef.current?.remove();
        estiloListoRef.current = false;
        map.remove();
        mapRef.current = null;
      };
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Error al inicializar MapLibre');
    }
  }, [handleInteractionStart, handleInteractionEnd, spinGlobe, onMapReady, abrirDetalleCelda]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && estiloListoRef.current) mostrarRectangulo(map, limites);
  }, [limites]);

  useEffect(() => {
    setRasterHistoricoEstado('cargando');
    const map = mapRef.current;
    if (map && estiloListoRef.current && (historicalRasterTiles || map.getSource(HISTORICAL_RASTER))) {
      mostrarCapaHistorica(map, historicalRasterTiles, historicalRasterBounds ?? bbox);
    }
  }, [historicalRasterTiles, historicalRasterBounds, bbox]);

  // Las geometrías seleccionables vienen del mismo catálogo que usa el selector.
  useEffect(() => {
    if (!isLoaded || !provinciasControllerRef.current || !apiProvincias) return;

    const fc: GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinciaFeatureProperties> = {
      type: 'FeatureCollection',
      features: apiProvincias.flatMap(({ geometria, provincia_id, nombre }) =>
        geometria ? [{ type: 'Feature', geometry: geometria, properties: { provincia_id, nombre } }] : []
      ),
    };
    provinciasGeoJSONRef.current = fc;
    provinciasControllerRef.current.setGeoJSON(fc);
    provinciasControllerRef.current.setSelectedProvincias(selectedProvinciaIdsRef.current);
  }, [isLoaded, apiProvincias]);

  // Sincronizar selección externa (provincia o región) con el estado GPU del mapa
  useEffect(() => {
    if (!isLoaded || !provinciasControllerRef.current) return;
    provinciasControllerRef.current.setSelectedProvincias(activeSelectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsZona, isLoaded]);

  useEffect(() => {
    popupRef.current?.remove();
    if (mapRef.current && estiloListoRef.current) dibujarCeldas(mapRef.current, celdasVisibles);
  }, [celdasVisibles]);

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
    if (historicalRasterTiles) setRasterHistoricoEstado('cargando');
    const nextMode = mapStyleMode === 'ign' ? 'satellite' : 'ign';
    setMapStyleMode(nextMode);
    mapStyleModeRef.current = nextMode;
    const map = mapRef.current;
    if (!map) return;

    const nextStyle = nextMode === 'satellite' ? SATELLITE_GLOBE_STYLE : DEFAULT_GLOBE_STYLE;
    isSpinningRef.current = false;
    setIsSpinning(false);
    map.stop();
    popupRef.current?.remove();
    estiloListoRef.current = false;
    map.setStyle(nextStyle, { diff: false });
  };

  const handleResetView = () => {
    const isSat = mapStyleModeRef.current === 'satellite';
    mapRef.current?.flyTo({
      center: [-64, -36],
      zoom: isSat ? 2.2 : 3.5,
      pitch: isSat ? 0 : 42,
      bearing: isSat ? 0 : -10,
      duration: 1800,
    });
  };

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col rounded-xl overflow-hidden border border-[#21312D] bg-[#07100F] ${
        isFullscreen
          ? 'fixed inset-0 z-[100] rounded-none w-screen h-screen'
          : `w-full ${className}`
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
              capa === 'armonizado'
                ? 'bg-[#B8EE68]'
                : capa === 'modis'
                ? 'bg-[#68D9D0]'
                : 'bg-[#FF9C55]'
            }`}
          />
          <span className="font-semibold">
            {capa === 'armonizado'
              ? (isEn ? 'HARMONIZED · VIIRS EQUIV' : 'ARMONIZADO · ESCALA VIIRS')
              : capa === 'modis'
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

          {mapStyleMode === 'satellite' && (
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
          <button
            type="button"
            disabled={!selectedMonth || !minMonth || selectedMonth <= minMonth}
            onClick={() => selectedMonth && selectMonth(shiftMonth(selectedMonth, -1))}
            aria-label={isEn ? 'Previous month' : 'Mes anterior'}
            className="flex h-9 w-9 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {selectedMonth ? (
            <time dateTime={selectedMonth} className="px-1 font-sans text-sm font-medium text-[#EFF5ED]">
              {formatMes(selectedMonth, isEn)}
            </time>
          ) : (
            <span className="px-1 font-sans text-sm text-[#93A39C]">—</span>
          )}
          <button
            type="button"
            disabled={!selectedMonth || !maxMonth || selectedMonth >= maxMonth}
            onClick={() => selectedMonth && selectMonth(shiftMonth(selectedMonth, 1))}
            aria-label={isEn ? 'Next month' : 'Mes siguiente'}
            className="flex h-9 w-9 items-center justify-center rounded border border-[#21312D] bg-[#111E1B] text-[#EFF5ED] hover:border-[#B8EE68]/50 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!selectedMonth || minMonth === maxMonth}
            onClick={alternarReproduccion}
            aria-pressed={isPlayingTimeline}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#21312D] bg-[#111E1B] px-2.5 text-xs font-sans font-medium text-[#EFF5ED] hover:border-[#B8EE68]/40 disabled:opacity-40 aria-pressed:border-[#B8EE68]/50 aria-pressed:text-[#B8EE68]"
          >
            {isPlayingTimeline ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlayingTimeline
              ? (isEn ? 'Pause playback' : 'Pausar reproducción')
              : (isEn ? 'Play months' : 'Reproducir meses')}
          </button>
          <span
            role="status"
            className={`tabular-nums text-xs text-[#C8D3CE] transition-opacity duration-200 ${
              isLoadingCells ? 'opacity-60' : 'opacity-100'
            }`}
          >
            {celdas.data && !cellsError ? textoContador(celdasVisibles.length, isEn) : cellsStatus}
          </span>
        </div>
      </div>

      {onInspectCell && (
        <div className="border-b border-[#21312D] px-4 py-1.5">
          <button type="button" disabled={!isLoaded || !celdasVisibles.length} onClick={abrirCeldaEjemplo}
            className="min-h-9 rounded-md border border-[#2A3F3A] px-2.5 text-sm text-[#B8EE68] hover:border-[#B8EE68] disabled:opacity-50">
            {isEn ? 'Open an example cell' : 'Abrir una celda de ejemplo'}
          </button>
        </div>
      )}

      {/* Viewport del Mapa 3D */}
      <div
        className="relative flex-1 w-full min-h-[220px]"
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
              <span>{isEn ? 'Hot spots per cell' : 'Focos por celda'}</span>
            </div>
            <div className="mt-1 flex flex-col gap-1 font-mono text-xs">
              {TRAMOS_FOCOS.map((tramo) => (
                <div key={tramo.desde} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tramo.color }} />
                  <span className="text-[#EFF5ED]">{etiquetaTramo(tramo, isEn)}</span>
                </div>
              ))}
              {mostrarLimites && (
                <div className="flex items-center gap-2">
                  <span className="w-4 border-t-2 border-[#B8EE68]" aria-hidden="true" />
                  <span>{isEn ? 'Area boundary' : 'Límite de la zona'}</span>
                </div>
              )}
              {capa === 'armonizado' && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-[#EFF5ED]" />
                  <span className="text-[#C8D3CE]">{isEn ? 'Estimated from MODIS' : 'Estimado desde MODIS'}</span>
                </div>
              )}
              <span className="max-w-[170px] font-sans text-[11px] leading-snug text-[#93A39C]">
                {isEn
                  ? `5 × 5 km cells with ≥${MIN_FOCOS_MAPA} hot spots in the month`
                  : `Celdas de 5 × 5 km con ≥${MIN_FOCOS_MAPA} focos en el mes`}
              </span>
            </div>
            <div className="mt-1 border-t border-[#21312D] pt-1 font-mono text-xs text-[#B8EE68]">
              {celdas.data && !cellsError ? (isEn ? 'LIVE API' : 'API EN VIVO') : cellsStatus}
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
          {historicalRasterTiles && historicalRasterSource && (
            <p>
              <a className="text-[#EFF5ED] underline" href={historicalRasterSource} target="_blank" rel="noreferrer">CONAE · 1986–2024</a>
              {rasterHistoricoEstado === 'cargando' && <span role="status"> · {isEn ? 'Loading historical layer…' : 'Cargando capa histórica…'}</span>}
              {rasterHistoricoEstado === 'error' && <span role="status"> · {isEn ? 'CONAE layer unavailable' : 'Capa CONAE no disponible'}</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
