import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as maplibregl from 'maplibre-gl';
import {
  attachProvinciasLayer,
  PROVINCIA_COLORS,
  PROVINCIAS_FILL_LAYER_ID,
  PROVINCIAS_LINE_LAYER_ID,
  PROVINCIAS_SOURCE_ID,
  type ProvinciaFeatureProperties,
} from '../src/features/globe/provinciasLayer';
import type { GeoJSON } from '../src/api/types';

function createMockMap() {
  const layerHandlers: Record<string, Array<(e: any) => void>> = {};
  const mapHandlers: Record<string, Array<(e: any) => void>> = {};
  const sources = new Map<string, any>();
  const layers = new Map<string, any>();
  const canvas = { style: { cursor: '' } };

  const map = {
    getCanvas: vi.fn(() => canvas),
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, spec: any) => {
      const sourceObj = {
        ...spec,
        setData: vi.fn((data: any) => {
          sourceObj.data = data;
        }),
      };
      sources.set(id, sourceObj);
    }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((spec: any) => {
      layers.set(spec.id, spec);
    }),
    setFeatureState: vi.fn(),
    queryRenderedFeatures: vi.fn(() => []),
    querySourceFeatures: vi.fn(() => []),
    on: vi.fn((event: string, layerOrCb: any, maybeCb?: any) => {
      if (typeof layerOrCb === 'string' && typeof maybeCb === 'function') {
        const key = `${event}:${layerOrCb}`;
        layerHandlers[key] = layerHandlers[key] || [];
        layerHandlers[key].push(maybeCb);
      } else if (typeof layerOrCb === 'function') {
        mapHandlers[event] = mapHandlers[event] || [];
        mapHandlers[event].push(layerOrCb);
      }
    }),
    off: vi.fn((event: string, layerOrCb: any, maybeCb?: any) => {
      if (typeof layerOrCb === 'string' && typeof maybeCb === 'function') {
        const key = `${event}:${layerOrCb}`;
        layerHandlers[key] = (layerHandlers[key] || []).filter((fn) => fn !== maybeCb);
      } else if (typeof layerOrCb === 'function') {
        mapHandlers[event] = (mapHandlers[event] || []).filter((fn) => fn !== layerOrCb);
      }
    }),
    __emitLayer: (event: string, layerId: string, payload?: any) => {
      const key = `${event}:${layerId}`;
      (layerHandlers[key] || []).forEach((fn) => fn(payload));
    },
    __emitMap: (event: string, payload?: any) => {
      (mapHandlers[event] || []).forEach((fn) => fn(payload));
    },
  };

  return { map, canvas, sources, layers };
}

const SAMPLE_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry, ProvinciaFeatureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[-65, -31], [-63, -31], [-63, -33], [-65, -33], [-65, -31]]],
      },
      properties: {
        provincia_id: '14',
        nombre: 'Córdoba',
      },
    },
  ],
};

describe('provinciasLayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures GeoJSON source with generateId: true and GPU-transitioned fill/line layers', () => {
    const { map, sources, layers } = createMockMap();
    const controller = attachProvinciasLayer(map as unknown as maplibregl.Map);
    controller.setGeoJSON(SAMPLE_GEOJSON);

    expect(sources.get(PROVINCIAS_SOURCE_ID)).toMatchObject({
      type: 'geojson',
      generateId: true,
    });
    expect(sources.get(PROVINCIAS_SOURCE_ID).setData).toHaveBeenCalledWith(SAMPLE_GEOJSON);

    const fillLayer = layers.get(PROVINCIAS_FILL_LAYER_ID);
    expect(fillLayer.paint['fill-color-transition']).toEqual({ duration: 250, delay: 0 });
    expect(fillLayer.paint['fill-opacity-transition']).toEqual({ duration: 250, delay: 0 });
    expect(fillLayer.paint['fill-color']).toEqual([
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      PROVINCIA_COLORS.selectedFill,
      ['boolean', ['feature-state', 'hover'], false],
      PROVINCIA_COLORS.hoverFill,
      PROVINCIA_COLORS.baseFill,
    ]);

    const lineLayer = layers.get(PROVINCIAS_LINE_LAYER_ID);
    expect(lineLayer.paint['line-width-transition']).toEqual({ duration: 200 });
    expect(lineLayer.paint['line-color-transition']).toEqual({ duration: 200 });
    expect(lineLayer.paint['line-color']).toContain(PROVINCIA_COLORS.activeLine);
  });

  it('manages hover feature-state without flicker across mousemove and mouseleave', () => {
    const { map, canvas } = createMockMap();
    attachProvinciasLayer(map as unknown as maplibregl.Map);

    // Move onto province A (id: 1)
    map.__emitLayer('mousemove', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 1, properties: { provincia_id: '14' } }],
    });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: PROVINCIAS_SOURCE_ID, id: 1 },
      { hover: true }
    );
    expect(canvas.style.cursor).toBe('pointer');

    // Rapid mousemove within same province A -> no redundant setFeatureState
    map.setFeatureState.mockClear();
    map.__emitLayer('mousemove', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 1, properties: { provincia_id: '14' } }],
    });
    expect(map.setFeatureState).not.toHaveBeenCalled();

    // Move directly from province A (1) to province B (2) -> clear A, highlight B
    map.__emitLayer('mousemove', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 2, properties: { provincia_id: '18' } }],
    });
    expect(map.setFeatureState).toHaveBeenNthCalledWith(
      1,
      { source: PROVINCIAS_SOURCE_ID, id: 1 },
      { hover: false }
    );
    expect(map.setFeatureState).toHaveBeenNthCalledWith(
      2,
      { source: PROVINCIAS_SOURCE_ID, id: 2 },
      { hover: true }
    );

    // Mouse leaves layer -> clear B and reset cursor
    map.setFeatureState.mockClear();
    map.__emitLayer('mouseleave', PROVINCIAS_FILL_LAYER_ID);
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: PROVINCIAS_SOURCE_ID, id: 2 },
      { hover: false }
    );
    expect(canvas.style.cursor).toBe('');
  });

  it('toggles selected state on click and clears on second click or background click', () => {
    const { map } = createMockMap();
    const onSelectProvincia = vi.fn();
    const sobreCelda = vi.fn().mockReturnValue(false);
    attachProvinciasLayer(map as unknown as maplibregl.Map, { onSelectProvincia, sobreCelda });

    // First click selects province 1
    map.__emitLayer('click', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 1, properties: { provincia_id: '14' } }],
    });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: PROVINCIAS_SOURCE_ID, id: 1 },
      { selected: true }
    );
    expect(onSelectProvincia).toHaveBeenLastCalledWith('14');

    // Second click on same province deselects it
    map.__emitLayer('click', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 1, properties: { provincia_id: '14' } }],
    });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: PROVINCIAS_SOURCE_ID, id: 1 },
      { selected: false }
    );
    expect(onSelectProvincia).toHaveBeenLastCalledWith(null);

    // El clic en una celda no debe cambiar la provincia.
    map.__emitLayer('click', PROVINCIAS_FILL_LAYER_ID, {
      features: [{ id: 2, properties: { provincia_id: '18' } }],
    });
    map.setFeatureState.mockClear();
    onSelectProvincia.mockClear();
    sobreCelda.mockReturnValueOnce(true);
    map.__emitMap('click', { point: { x: 10, y: 10 } });
    expect(map.setFeatureState).not.toHaveBeenCalled();
    expect(onSelectProvincia).not.toHaveBeenCalled();

    // Background click outside any province or hotspot deselects
    map.queryRenderedFeatures.mockReturnValue([]);
    map.__emitMap('click', { point: { x: 10, y: 10 } });
    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: PROVINCIAS_SOURCE_ID, id: 2 },
      { selected: false }
    );
    expect(onSelectProvincia).toHaveBeenLastCalledWith(null);
  });
});
