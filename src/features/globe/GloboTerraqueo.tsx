import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  attachProvinciasLayer,
  PROVINCIAS_GEOJSON_URL,
  type ProvinciaFeatureProperties,
  type ProvinciasLayerController,
} from './provinciasLayer';
import {
  getMapaCeldas,
  getMapaIndustriales,
  rangoDelMes,
  BBOX_ARGENTINA,
  type BBox,
  type Capa,
  type GeoJSON,
} from '../../api';
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
  Loader2,
  Pentagon,
  Check,
  X,
  Factory,
} from 'lucide-react';

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

interface GloboTerraqueoProps {
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  center?: [number, number];
  zoom?: number;
  capa?: Capa;
  /** Mes que pinta la capa de celdas (YYYY-MM). */
  mesMapa?: string | null;
  onChangeMesMapa?: (mes: string) => void;
  mesMin?: string;
  mesMax?: string;
  fechaMin?: string;
  fechaMax?: string;
  /** Polígono de la zona elegida (se dibuja su contorno). */
  geometriaZona?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  /** Se llama al terminar de dibujar un polígono en el mapa. */
  onPoligonoDibujado?: (poligono: GeoJSON.Polygon) => void;
  selectedProvinciaId?: string;
  onSelectProvincia?: (provinciaId: string | null) => void;
}

const VACIO: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
const DEBOUNCE_MS = 300;
/** Debajo de este zoom se pide todo el país (1 mes entra en el límite de 20.000 celdas). */
const ZOOM_PAIS = 4;
const MAX_VERTICES = 2000;

// Rampa para `valor` (focos por celda de 5 × 5 km en el período)
const RAMPA: [number, string][] = [
  [1, '#FFE08A'],
  [3, '#FF9C55'],
  [10, '#FF6759'],
  [30, '#D7263D'],
];

type EstadoMapa =
  | { tipo: 'inactivo' }
  | { tipo: 'cargando' }
  | { tipo: 'ok'; celdas: number }
  | { tipo: 'error'; mensaje: string };

/** Vista actual recortada a Argentina y redondeada hacia afuera (evita pedidos por cambios mínimos). */
function bboxDeVista(map: maplibregl.Map): BBox {
  if (map.getZoom() < ZOOM_PAIS) return BBOX_ARGENTINA;
  const b = map.getBounds();
  if (!b) return BBOX_ARGENTINA;
  const paso = 0.25;
  const oeste = Math.max(BBOX_ARGENTINA[0], Math.floor(b.getWest() / paso) * paso);
  const sur = Math.max(BBOX_ARGENTINA[1], Math.floor(b.getSouth() / paso) * paso);
  const este = Math.min(BBOX_ARGENTINA[2], Math.ceil(b.getEast() / paso) * paso);
  const norte = Math.min(BBOX_ARGENTINA[3], Math.ceil(b.getNorth() / paso) * paso);
  if (oeste >= este || sur >= norte) return BBOX_ARGENTINA;
  return [oeste, sur, este, norte];
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const GloboTerraqueo: React.FC<GloboTerraqueoProps> = ({
  className = '',
  onMapReady,
  center = [-64, -36],
  zoom = 2.0,
  capa = 'armonizado',
  mesMapa = null,
  onChangeMesMapa,
  mesMin,
  mesMax,
  fechaMin,
  fechaMax,
  geometriaZona,
  onPoligonoDibujado,
  selectedProvinciaId,
  onSelectProvincia,
}) => {
  const { t, i18n } = useTranslation();
  const isEn = !Boolean(i18n?.language?.startsWith('es'));

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const provinciasControllerRef = useRef<ProvinciasLayerController | null>(null);
  const provinciasGeoJSONRef = useRef<GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    ProvinciaFeatureProperties
  > | null>(null);
  const selectedProvinciaIdRef = useRef(selectedProvinciaId);
  const onSelectProvinciaRef = useRef(onSelectProvincia);
  onSelectProvinciaRef.current = onSelectProvincia;
  const idleTimeoutRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const ultimoPedidoRef = useRef<string>('');

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isSpinning, setIsSpinning] = useState(!prefersReducedMotion);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [estadoMapa, setEstadoMapa] = useState<EstadoMapa>({ tipo: 'inactivo' });
  const [mostrarIndustriales, setMostrarIndustriales] = useState(false);
  const [dibujando, setDibujando] = useState(false);
  const [vertices, setVertices] = useState<[number, number][]>([]);

  // Refs para leer el estado actual desde los listeners de Mapbox (registrados una sola vez)
  const spinStateRef = useRef({ isSpinning, isUserInteracting, dibujando });
  spinStateRef.current = { isSpinning, isUserInteracting, dibujando };
  const consultaRef = useRef({ capa, mesMapa, fechaMin, fechaMax });
  consultaRef.current = { capa, mesMapa, fechaMin, fechaMax };
  const dibujandoRef = useRef(false);
  dibujandoRef.current = dibujando;

  // ── Rotación orbital ────────────────────────────────────────────────
  const secondsPerRevolution = 180;
  const maxSpinZoom = 4;
  const slowSpinZoom = 2.5;

  const spinGlobe = useCallback(() => {
    const map = mapRef.current;
    const s = spinStateRef.current;
    if (!map || !s.isSpinning || s.isUserInteracting || s.dibujando) return;
    const currentZoom = map.getZoom();
    if (currentZoom < maxSpinZoom) {
      let distancePerSecond = 360 / secondsPerRevolution;
      if (currentZoom > slowSpinZoom) {
        distancePerSecond *= (maxSpinZoom - currentZoom) / (maxSpinZoom - slowSpinZoom);
      }
      const mapCenter = map.getCenter();
      mapCenter.lng -= distancePerSecond / 60;
      map.easeTo({ center: mapCenter, duration: 1000, easing: (n: number) => n });
    }
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsUserInteracting(true);
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (idleTimeoutRef.current) window.clearTimeout(idleTimeoutRef.current);
    idleTimeoutRef.current = window.setTimeout(() => setIsUserInteracting(false), 3500);
  }, []);

  // ── Capa de celdas: pedido con debounce y cancelación ────────────────
  const pedirCeldas = useCallback((forzar = false) => {
    const map = mapRef.current;
    const { capa: c, mesMapa: mes, fechaMin: fmin, fechaMax: fmax } = consultaRef.current;
    if (!map || !mes || !map.getSource('celdas')) return;
    const bbox = bboxDeVista(map).join(',');
    const { desde, hasta } = rangoDelMes(mes, fmin, fmax);
    const clave = `${bbox}|${desde}|${hasta}|${c}`;
    if (!forzar && clave === ultimoPedidoRef.current) return;
    ultimoPedidoRef.current = clave;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setEstadoMapa({ tipo: 'cargando' });

    getMapaCeldas({ bbox, desde, hasta, capa: c }, controller.signal)
      .then((fc) => {
        if (controller.signal.aborted) return;
        (map.getSource('celdas') as maplibregl.GeoJSONSource | undefined)?.setData(fc as never);
        setEstadoMapa({ tipo: 'ok', celdas: fc.features.length });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        ultimoPedidoRef.current = ''; // permitir reintento
        (map.getSource('celdas') as maplibregl.GeoJSONSource | undefined)?.setData(VACIO as never);
        // 413 RESULTADO_DEMASIADO_GRANDE: la API ya dice "acercá el mapa o acortá el período"
        setEstadoMapa({ tipo: 'error', mensaje: err instanceof Error ? err.message : String(err) });
      });
  }, []);

  const pedirCeldasDebounced = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => pedirCeldas(), DEBOUNCE_MS);
  }, [pedirCeldas]);

  // ── Inicializar MapLibre GL JS (sin token) ───────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      const style = import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_GLOBE_STYLE;
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center,
        zoom: zoom === 2.0 ? 3.5 : zoom,
        minZoom: 1,
        maxZoom: 14,
        cooperativeGestures: true,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on('style.load', () => {
        try {
          map.setProjection?.({ type: 'mercator' });
        } catch {
          // Ignorar si el estilo difiere
        }

        if (!provinciasControllerRef.current) {
          provinciasControllerRef.current = attachProvinciasLayer(map, {
            onSelectProvincia: (pid) => {
              if (!dibujandoRef.current) onSelectProvinciaRef.current?.(pid);
            },
          });
        } else {
          provinciasControllerRef.current.ensureLayers();
        }

        if (provinciasGeoJSONRef.current) {
          provinciasControllerRef.current.setGeoJSON(provinciasGeoJSONRef.current);
          provinciasControllerRef.current.setSelectedProvincia(selectedProvinciaIdRef.current ?? null);
        }

        map.addSource('celdas', { type: 'geojson', data: VACIO as never });
        map.addLayer({
          id: 'celdas-fill',
          type: 'fill',
          source: 'celdas',
          paint: {
            'fill-color': ['interpolate', ['linear'], ['get', 'valor'], ...RAMPA.flat()] as never,
            'fill-opacity': ['case', ['==', ['get', 'estado'], 'observado'], 0.8, 0.6] as never,
            'fill-outline-color': 'rgba(7,16,15,0.35)',
          },
        });

        map.addSource('industriales', { type: 'geojson', data: VACIO as never });
        map.addLayer({
          id: 'industriales-circle',
          type: 'circle',
          source: 'industriales',
          layout: { visibility: 'none' },
          paint: {
            'circle-radius': 4,
            'circle-color': '#68D9D0',
            'circle-stroke-color': '#07100F',
            'circle-stroke-width': 1,
          },
        });

        map.addSource('zona', { type: 'geojson', data: VACIO as never });
        map.addLayer({
          id: 'zona-line',
          type: 'line',
          source: 'zona',
          paint: { 'line-color': '#B8EE68', 'line-width': 2 },
        });

        map.addSource('dibujo', { type: 'geojson', data: VACIO as never });
        map.addLayer({
          id: 'dibujo-fill',
          type: 'fill',
          source: 'dibujo',
          filter: ['==', ['geometry-type'], 'Polygon'],
          paint: { 'fill-color': '#B8EE68', 'fill-opacity': 0.15 },
        });
        map.addLayer({
          id: 'dibujo-line',
          type: 'line',
          source: 'dibujo',
          paint: { 'line-color': '#B8EE68', 'line-width': 2, 'line-dasharray': [2, 1] },
        });
        map.addLayer({
          id: 'dibujo-vertices',
          type: 'circle',
          source: 'dibujo',
          filter: ['==', ['geometry-type'], 'Point'],
          paint: { 'circle-radius': 4, 'circle-color': '#B8EE68', 'circle-stroke-color': '#07100F', 'circle-stroke-width': 1 },
        });

        setIsLoaded(true);
        pedirCeldas(true);
        if (onMapReady) onMapReady(map);
      });

      // Detalle de una celda al hacer clic
      map.on('click', 'celdas-fill', (e: maplibregl.MapLayerMouseEvent) => {
        if (dibujandoRef.current) return;
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, unknown>;
        const viirs = p.viirs === null || p.viirs === undefined || p.viirs === 'null' ? (isEn ? 'no data' : 'sin dato') : String(p.viirs);
        new maplibregl.Popup({ offset: 8, closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:'DM Mono',monospace;font-size:12px;padding:6px;color:#EFF5ED;background:#0D1816;border:1px solid #21312D;border-radius:4px">
              <strong style="color:#FF9C55">${isEn ? 'Cell' : 'Celda'} ${escapeHtml(String(p.cell_id))}</strong><br/>
              ${isEn ? 'Value' : 'Valor'}: <b>${escapeHtml(String(p.valor))}</b> ${isEn ? 'spots' : 'focos'} (${escapeHtml(String(p.estado))})<br/>
              MODIS: ${escapeHtml(String(p.modis))} · VIIRS: ${escapeHtml(viirs)}
            </div>`,
          )
          .addTo(map);
      });

      map.on('click', 'industriales-circle', (e: maplibregl.MapLayerMouseEvent) => {
        if (dibujandoRef.current) return;
        const p = (e.features?.[0]?.properties ?? {}) as Record<string, unknown>;
        new maplibregl.Popup({ offset: 8, closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:'DM Mono',monospace;font-size:12px;padding:6px;color:#EFF5ED;background:#0D1816;border:1px solid #21312D;border-radius:4px">
              <strong style="color:#68D9D0">${isEn ? 'Fixed source (excluded)' : 'Fuente fija (excluida)'}</strong><br/>
              ${escapeHtml(String(p.motivo))} · ${escapeHtml(String(p.n_focos))} ${isEn ? 'spots' : 'focos'}
            </div>`,
          )
          .addTo(map);
      });

      // Dibujo de polígono: cada clic agrega un vértice
      map.on('click', (e: maplibregl.MapMouseEvent) => {
        if (!dibujandoRef.current) return;
        setVertices((prev) => (prev.length >= MAX_VERTICES ? prev : [...prev, [e.lngLat.lng, e.lngLat.lat]]));
      });

      map.on('error', () => {
        // Evitar bloquear la UI por fallos transitorios de teselas externas
      });

      map.on('mousedown', handleInteractionStart);
      map.on('touchstart', handleInteractionStart);
      map.on('dragstart', handleInteractionStart);
      map.on('mouseup', handleInteractionEnd);
      map.on('touchend', handleInteractionEnd);
      map.on('moveend', () => {
        spinGlobe();
        pedirCeldasDebounced();
      });

      return () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        abortRef.current?.abort();
        provinciasControllerRef.current?.destroy();
        provinciasControllerRef.current = null;
        ultimoPedidoRef.current = '';
        map.remove();
        mapRef.current = null;
        setIsLoaded(false);
      };
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'Error al inicializar MapLibre');
    }
    // El mapa se crea una sola vez; el resto se sincroniza en otros efectos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar GeoJSON estático de provincias desde public/ (sin depender del backend)
  useEffect(() => {
    if (!isLoaded || !provinciasControllerRef.current) return;
    if (provinciasGeoJSONRef.current) {
      provinciasControllerRef.current.setGeoJSON(provinciasGeoJSONRef.current);
      provinciasControllerRef.current.setSelectedProvincia(selectedProvinciaIdRef.current ?? null);
      return;
    }

    const controller = new AbortController();
    fetch(PROVINCIAS_GEOJSON_URL, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.type !== 'FeatureCollection' || !provinciasControllerRef.current) return;
        provinciasGeoJSONRef.current = data;
        provinciasControllerRef.current.setGeoJSON(data);
        provinciasControllerRef.current.setSelectedProvincia(selectedProvinciaIdRef.current ?? null);
      })
      .catch(() => {
        // Silencioso en entornos sin red o tests jsdom
      });

    return () => controller.abort();
  }, [isLoaded]);

  // Sincronizar selección externa con el estado GPU del mapa
  useEffect(() => {
    selectedProvinciaIdRef.current = selectedProvinciaId;
    if (!isLoaded || !provinciasControllerRef.current) return;
    provinciasControllerRef.current.setSelectedProvincia(selectedProvinciaId ?? null);
  }, [selectedProvinciaId, isLoaded]);

  // Volver a pedir celdas al cambiar capa o mes
  useEffect(() => {
    if (isLoaded) pedirCeldas();
  }, [capa, mesMapa, fechaMin, fechaMax, isLoaded, pedirCeldas]);

  // Capa informativa de fuentes fijas (se pide una vez, todo el país)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    map.setLayoutProperty('industriales-circle', 'visibility', mostrarIndustriales ? 'visible' : 'none');
    if (!mostrarIndustriales) return;
    const controller = new AbortController();
    getMapaIndustriales(undefined, controller.signal)
      .then((fc) => (map.getSource('industriales') as maplibregl.GeoJSONSource | undefined)?.setData(fc as never))
      .catch(() => undefined);
    return () => controller.abort();
  }, [mostrarIndustriales, isLoaded]);

  // Contorno de la zona elegida (polígono dibujado)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const data: GeoJSON.FeatureCollection = geometriaZona
      ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: geometriaZona, properties: {} }] }
      : VACIO;
    (map.getSource('zona') as maplibregl.GeoJSONSource | undefined)?.setData(data as never);
  }, [geometriaZona, isLoaded]);

  // Polígono en construcción
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const features: GeoJSON.Feature[] = vertices.map((v) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: v } as GeoJSON.Point, properties: {} }));
    if (vertices.length >= 3) {
      features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...vertices, vertices[0]]] } as GeoJSON.Polygon, properties: {} });
    } else if (vertices.length === 2) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: vertices }, properties: {} });
    }
    (map.getSource('dibujo') as maplibregl.GeoJSONSource | undefined)?.setData({ type: 'FeatureCollection', features } as never);
  }, [vertices, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    if (dibujando) {
      map.doubleClickZoom.disable();
      map.getCanvas().style.cursor = 'crosshair';
    } else {
      map.doubleClickZoom.enable();
      map.getCanvas().style.cursor = '';
    }
  }, [dibujando, isLoaded]);

  const empezarDibujo = () => {
    setVertices([]);
    setDibujando(true);
    setIsSpinning(false);
  };
  const cancelarDibujo = () => {
    setDibujando(false);
    setVertices([]);
  };
  const terminarDibujo = () => {
    if (vertices.length < 3) return;
    onPoligonoDibujado?.({ type: 'Polygon', coordinates: [[...vertices, vertices[0]]] });
    setDibujando(false);
    setVertices([]);
  };

  // Vuelo suave cuando cambia la zona
  useEffect(() => {
    if (mapRef.current && isLoaded) {
      mapRef.current.flyTo({ center, zoom, duration: 1800, essential: true });
    }
  }, [center, zoom, isLoaded]);

  // Loop de auto-rotación
  useEffect(() => {
    if (!isLoaded || !isSpinning || isUserInteracting || dibujando) return;
    spinGlobe();
    const interval = window.setInterval(spinGlobe, 1000);
    return () => clearInterval(interval);
  }, [isLoaded, isSpinning, isUserInteracting, dibujando, spinGlobe]);

  const handleResetView = () => {
    mapRef.current?.flyTo({ center: [-64, -36], zoom: 3.5, duration: 1800, essential: true });
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-[#21312D] bg-[#07100F] ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : `w-full h-[520px] lg:h-[580px] ${className}`
      }`}
    >
      {/* Barra de cabecera del globo */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0D1816]/95 backdrop-blur-md border-b border-[#21312D] text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#B8EE68]/20 text-[#B8EE68]">
            <GlobeIcon className="h-3.5 w-3.5" />
          </div>
          <span className="font-title font-bold text-[#EFF5ED]">{t('globe.title')}</span>
          <span className="hidden xl:inline rounded bg-[#B8EE68]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#B8EE68]">{t('globe.badge')}</span>
        </div>

        {/* Mes que pinta el mapa */}
        <label className="flex items-center gap-1.5 font-sans text-xs text-[#93A39C]">
          <span>{isEn ? 'Map month' : 'Mes del mapa'}</span>
          <input
            type="month"
            value={mesMapa ?? ''}
            min={mesMin}
            max={mesMax}
            disabled={!mesMapa}
            onChange={(e) => e.target.value && onChangeMesMapa?.(e.target.value)}
            className="rounded-md border border-[#21312D] bg-[#07100F] px-2 py-1 font-mono text-xs text-[#EFF5ED] focus:border-[#B8EE68] focus:outline-none [color-scheme:dark]"
          />
        </label>

        <div className="flex items-center gap-1.5 font-sans text-xs">
          <button
            type="button"
            onClick={() => setIsSpinning((prev) => !prev)}
            aria-pressed={isSpinning}
            title={isSpinning ? t('globe.pauseSpin') : t('globe.resumeSpin')}
            className={`inline-flex min-h-[36px] sm:min-h-[32px] items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isSpinning ? 'bg-[#B8EE68]/20 text-[#B8EE68] border border-[#B8EE68]/40' : 'bg-[#111E1B] text-[#93A39C] hover:text-[#EFF5ED] border border-[#21312D]'
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
            title={isFullscreen ? (isEn ? 'Exit fullscreen' : 'Salir de pantalla completa') : isEn ? 'Fullscreen' : 'Pantalla completa'}
            className="flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded-md border border-[#21312D] bg-[#111E1B] p-2 sm:p-1.5 text-[#93A39C] hover:text-[#EFF5ED] focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewport del mapa */}
      <div className="relative flex-1 w-full h-full min-h-[380px] bg-[#050C0B]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#07100F]/95 backdrop-blur-md text-[#EFF5ED]">
            <div className="w-full max-w-md rounded-xl border border-[#21312D] bg-[#0D1816] p-6 text-center">
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#FF6759]/40 bg-[#FF6759]/10 p-2.5 text-left text-xs text-[#FF6759]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda y estado de la capa de celdas */}
        {isLoaded && (
          <div className="absolute top-3 left-3 z-10 flex max-w-[260px] flex-col gap-1.5 rounded-md border border-[#21312D] bg-[#07100F]/90 p-2.5 backdrop-blur-md text-xs">
            <div className="flex items-center gap-1.5 font-sans text-xs font-semibold text-[#EFF5ED] border-b border-[#21312D] pb-1">
              <Flame className="h-3.5 w-3.5 text-[#FF6759]" />
              <span>{isEn ? 'Spots per 5 km cell' : 'Focos por celda de 5 km'}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs text-[#93A39C]">
              {RAMPA.map(([v, c]) => (
                <span key={v} className="flex items-center gap-0.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
                  <span>{v === 30 ? '30+' : v}</span>
                </span>
              ))}
            </div>
            <div className="font-mono text-xs" role="status" aria-live="polite">
              {estadoMapa.tipo === 'cargando' && (
                <span className="flex items-center gap-1 text-[#93A39C]">
                  <Loader2 className="h-3 w-3 animate-spin text-[#B8EE68]" />
                  {isEn ? 'Loading cells…' : 'Cargando celdas…'}
                </span>
              )}
              {estadoMapa.tipo === 'ok' && (
                <span className="text-[#B8EE68]">
                  {estadoMapa.celdas.toLocaleString(isEn ? 'en-US' : 'es-AR')} {isEn ? 'cells' : 'celdas'} · {mesMapa} · {capa}
                </span>
              )}
              {estadoMapa.tipo === 'error' && (
                <span className="flex items-start gap-1 text-[#FF6759]">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-px" />
                  {estadoMapa.mensaje}
                </span>
              )}
            </div>
            <label className="flex items-center gap-1.5 border-t border-[#21312D] pt-1 font-sans text-xs text-[#93A39C] cursor-pointer">
              <input type="checkbox" checked={mostrarIndustriales} onChange={(e) => setMostrarIndustriales(e.target.checked)} className="accent-[#68D9D0]" />
              <Factory className="h-3 w-3 text-[#68D9D0]" />
              <span>{isEn ? 'Fixed sources (excluded)' : 'Fuentes fijas (excluidas)'}</span>
            </label>
          </div>
        )}

        {/* Dibujo de zona */}
        {isLoaded && onPoligonoDibujado && (
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
            {!dibujando ? (
              <button
                type="button"
                onClick={empezarDibujo}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[#21312D] bg-[#07100F]/90 px-2.5 py-1 font-sans text-xs font-medium text-[#EFF5ED] backdrop-blur-md hover:border-[#B8EE68]/50"
              >
                <Pentagon className="h-3.5 w-3.5 text-[#B8EE68]" />
                {isEn ? 'Draw area' : 'Dibujar zona'}
              </button>
            ) : (
              <div className="flex flex-col items-end gap-1.5 rounded-md border border-[#B8EE68]/40 bg-[#07100F]/95 p-2 backdrop-blur-md">
                <span className="font-sans text-xs text-[#93A39C]">
                  {isEn ? `Click to add points (${vertices.length})` : `Hacé clic para agregar puntos (${vertices.length})`}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={terminarDibujo}
                    disabled={vertices.length < 3}
                    className="inline-flex items-center gap-1 rounded-md bg-[#B8EE68] px-2.5 py-1 font-sans text-xs font-bold text-[#07100F] disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isEn ? 'Finish' : 'Terminar'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarDibujo}
                    className="inline-flex items-center gap-1 rounded-md border border-[#21312D] bg-[#111E1B] px-2.5 py-1 font-sans text-xs text-[#93A39C] hover:text-[#EFF5ED]"
                  >
                    <X className="h-3.5 w-3.5" />
                    {isEn ? 'Cancel' : 'Cancelar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controles de zoom */}
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

        <div className="absolute bottom-2 left-3 z-10 rounded border border-[#21312D] bg-[#07100F]/85 px-2 py-0.5 font-mono text-xs text-[#93A39C] backdrop-blur-md">
          {t('globe.attribution')}
        </div>
      </div>
    </div>
  );
};
