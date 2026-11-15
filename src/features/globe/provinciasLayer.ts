import type * as maplibregl from 'maplibre-gl';
import type { GeoJSON } from '../../api/types';

export const PROVINCIAS_SOURCE_ID = 'provincias-source';
export const PROVINCIAS_FILL_LAYER_ID = 'provincias-fill';
export const PROVINCIAS_LINE_LAYER_ID = 'provincias-line';
export const PROVINCIAS_GEOJSON_URL = '/data/provincias-argentina.geojson';

/**
 * Visual palette for GPU-accelerated province hover & selection states.
 * Contrasts against the dark cartographic base (#07100F / IGN Argenmap Oscuro).
 */
export const PROVINCIA_COLORS = {
  baseFill: '#1E293B',
  hoverFill: '#2A3B55',
  selectedFill: '#0284C7',
  baseLine: 'rgba(56, 189, 248, 0.25)',
  activeLine: '#38BDF8',
} as const;

export interface ProvinciaFeatureProperties {
  provincia_id: string;
  nombre: string;
}

export interface ProvinciasLayerOptions {
  onSelectProvincia?: (provinciaId: string | null) => void;
}

export interface ProvinciasLayerController {
  setGeoJSON: (
    data: GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinciaFeatureProperties>
  ) => void;
  setSelectedProvincia: (provinciaId?: string | null) => void;
  setSelectedProvincias: (provinciaIds: string[]) => void;
  ensureLayers: () => void;
  destroy: () => void;
}

/**
 * Attaches a GPU-accelerated MapLibre GeoJSON source + fill/line layers for Argentine provinces.
 * Uses `generateId: true` and `map.setFeatureState` (no `setFilter` re-renders) with native
 * WebGL transitions and flicker-free `mousemove` / `mouseleave` / `click` handling.
 */
export function attachProvinciasLayer(
  map: maplibregl.Map,
  options: ProvinciasLayerOptions = {}
): ProvinciasLayerController {
  let hoveredId: string | number | null = null;
  const selectedIds = new Set<string | number>();
  let desiredProvinciaIds: string[] = [];
  let lastGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinciaFeatureProperties> = {
    type: 'FeatureCollection',
    features: [],
  };
  const provIdToFeatureId = new Map<string, string | number>();

  const setStateSafe = (
    id: string | number | null,
    state: { hover?: boolean; selected?: boolean }
  ) => {
    if (id === null || id === undefined) return;
    if (typeof map.getSource !== 'function' || !map.getSource(PROVINCIAS_SOURCE_ID)) return;
    map.setFeatureState?.({ source: PROVINCIAS_SOURCE_ID, id }, state);
  };

  const setCursor = (cursor: string) => {
    const canvas = map.getCanvas?.();
    if (canvas) {
      canvas.style.cursor = cursor;
    }
  };

  const rebuildFeatureIndex = () => {
    provIdToFeatureId.clear();
    if (typeof map.querySourceFeatures !== 'function') return;
    if (!map.getSource?.(PROVINCIAS_SOURCE_ID)) return;

    const rendered = map.querySourceFeatures(PROVINCIAS_SOURCE_ID);
    for (const feat of rendered) {
      const pid = feat.properties?.provincia_id as string | undefined;
      if (pid && feat.id !== undefined && feat.id !== null) {
        provIdToFeatureId.set(pid, feat.id);
      }
    }
  };

  const applySelectedFeatureIds = (nextIds: Iterable<string | number>) => {
    const nextSet = new Set(nextIds);
    for (const id of selectedIds) {
      if (!nextSet.has(id)) {
        setStateSafe(id, { selected: false });
      }
    }
    for (const id of nextSet) {
      if (!selectedIds.has(id)) {
        setStateSafe(id, { selected: true });
      }
    }
    selectedIds.clear();
    for (const id of nextSet) {
      selectedIds.add(id);
    }
  };

  const ensureLayers = () => {
    if (typeof map.getSource !== 'function' || typeof map.addSource !== 'function') return;

    if (!map.getSource(PROVINCIAS_SOURCE_ID)) {
      map.addSource(PROVINCIAS_SOURCE_ID, {
        type: 'geojson',
        data: lastGeoJSON as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0],
        generateId: true,
      });
    }

    if (!map.getLayer?.(PROVINCIAS_FILL_LAYER_ID)) {
      map.addLayer({
        id: PROVINCIAS_FILL_LAYER_ID,
        type: 'fill',
        source: PROVINCIAS_SOURCE_ID,
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            PROVINCIA_COLORS.selectedFill,
            ['boolean', ['feature-state', 'hover'], false],
            PROVINCIA_COLORS.hoverFill,
            PROVINCIA_COLORS.baseFill,
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.42,
            ['boolean', ['feature-state', 'hover'], false],
            0.38,
            0.16,
          ],
          'fill-color-transition': { duration: 250, delay: 0 },
          'fill-opacity-transition': { duration: 250, delay: 0 },
        },
      });
    }

    if (!map.getLayer?.(PROVINCIAS_LINE_LAYER_ID)) {
      map.addLayer({
        id: PROVINCIAS_LINE_LAYER_ID,
        type: 'line',
        source: PROVINCIAS_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            PROVINCIA_COLORS.activeLine,
            ['boolean', ['feature-state', 'hover'], false],
            PROVINCIA_COLORS.activeLine,
            PROVINCIA_COLORS.baseLine,
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            ['boolean', ['feature-state', 'hover'], false],
            2,
            1,
          ],
          'line-width-transition': { duration: 200 },
          'line-color-transition': { duration: 200 },
        },
      });
    }
  };

  const handleMouseMove = (e: maplibregl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.id === undefined || feature.id === null) return;

    const nextId = feature.id;
    const pid = feature.properties?.provincia_id as string | undefined;
    if (pid) provIdToFeatureId.set(pid, nextId);

    // Avoid redundant state updates on rapid mousemove within the same province (prevents flicker)
    if (hoveredId !== nextId) {
      if (hoveredId !== null) {
        setStateSafe(hoveredId, { hover: false });
      }
      hoveredId = nextId;
      setStateSafe(hoveredId, { hover: true });
    }

    setCursor('pointer');
  };

  const handleMouseLeave = () => {
    if (hoveredId !== null) {
      setStateSafe(hoveredId, { hover: false });
      hoveredId = null;
    }
    setCursor('');
  };

  const isHotspotEvent = (e: { originalEvent?: Event }) => {
    const target = e.originalEvent?.target as HTMLElement | null | undefined;
    return Boolean(target?.closest?.('.hotspot-marker'));
  };

  const handleLayerClick = (e: maplibregl.MapLayerMouseEvent) => {
    if (isHotspotEvent(e)) return;
    const feature = e.features?.[0];
    if (!feature || feature.id === undefined || feature.id === null) return;

    const clickedId = feature.id;
    const pid = (feature.properties?.provincia_id as string | undefined) ?? null;
    if (pid) provIdToFeatureId.set(pid, clickedId);

    if (selectedIds.size === 1 && selectedIds.has(clickedId)) {
      applySelectedFeatureIds([]);
      desiredProvinciaIds = [];
      options.onSelectProvincia?.(null);
    } else {
      applySelectedFeatureIds([clickedId]);
      desiredProvinciaIds = pid ? [pid] : [];
      options.onSelectProvincia?.(pid);
    }
  };

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (isHotspotEvent(e)) return;
    if (!map.getLayer?.(PROVINCIAS_FILL_LAYER_ID)) return;
    if (typeof map.queryRenderedFeatures !== 'function') return;

    const hits = map.queryRenderedFeatures(e.point, {
      layers: [PROVINCIAS_FILL_LAYER_ID],
    });

    if (hits.length === 0 && selectedIds.size > 0) {
      applySelectedFeatureIds([]);
      desiredProvinciaIds = [];
      options.onSelectProvincia?.(null);
    }
  };

  const handleSourceData = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId !== PROVINCIAS_SOURCE_ID || !e.isSourceLoaded) return;
    rebuildFeatureIndex();
    if (desiredProvinciaIds.length > 0) {
      const targetFeatureIds = desiredProvinciaIds
        .map((id) => provIdToFeatureId.get(id))
        .filter((id): id is string | number => id !== undefined && id !== null);
      applySelectedFeatureIds(targetFeatureIds);
    }
  };

  ensureLayers();
  map.on?.('mousemove', PROVINCIAS_FILL_LAYER_ID, handleMouseMove);
  map.on?.('mouseleave', PROVINCIAS_FILL_LAYER_ID, handleMouseLeave);
  map.on?.('click', PROVINCIAS_FILL_LAYER_ID, handleLayerClick);
  map.on?.('click', handleMapClick);
  map.on?.('sourcedata', handleSourceData);

  const syncDesiredSelection = () => {
    if (desiredProvinciaIds.length === 0) {
      applySelectedFeatureIds([]);
      return;
    }
    rebuildFeatureIndex();
    const targetFeatureIds = desiredProvinciaIds
      .map((id) => provIdToFeatureId.get(id))
      .filter((id): id is string | number => id !== undefined && id !== null);
    if (targetFeatureIds.length > 0) {
      applySelectedFeatureIds(targetFeatureIds);
    }
  };

  return {
    setGeoJSON(data) {
      lastGeoJSON = data;
      ensureLayers();
      const source = map.getSource?.(PROVINCIAS_SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      source?.setData?.(
        lastGeoJSON as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0]
      );
      hoveredId = null;
      selectedIds.clear();
      provIdToFeatureId.clear();
    },

    setSelectedProvincia(provinciaId?: string | null) {
      desiredProvinciaIds = provinciaId ? [provinciaId] : [];
      syncDesiredSelection();
    },

    setSelectedProvincias(provinciaIds: string[]) {
      desiredProvinciaIds = provinciaIds;
      syncDesiredSelection();
    },

    ensureLayers() {
      hoveredId = null;
      selectedIds.clear();
      ensureLayers();
      if (lastGeoJSON.features.length > 0) {
        const source = map.getSource?.(PROVINCIAS_SOURCE_ID) as
          | maplibregl.GeoJSONSource
          | undefined;
        source?.setData?.(
          lastGeoJSON as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0]
        );
      }
    },

    destroy() {
      if (hoveredId !== null) {
        setStateSafe(hoveredId, { hover: false });
        hoveredId = null;
      }
      if (selectedIds.size > 0) {
        for (const id of selectedIds) {
          setStateSafe(id, { selected: false });
        }
        selectedIds.clear();
      }
      setCursor('');
      map.off?.('mousemove', PROVINCIAS_FILL_LAYER_ID, handleMouseMove);
      map.off?.('mouseleave', PROVINCIAS_FILL_LAYER_ID, handleMouseLeave);
      map.off?.('click', PROVINCIAS_FILL_LAYER_ID, handleLayerClick);
      map.off?.('click', handleMapClick);
      map.off?.('sourcedata', handleSourceData);
    },
  };
}
