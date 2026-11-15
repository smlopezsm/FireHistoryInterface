import type * as maplibregl from 'maplibre-gl';
import type { CeldaMapa } from './celdasMapa';

const ID_CELDAS = 'focos-celdas';
const ID_ESTIMADAS = 'focos-celdas-estimadas';

export function dibujarCeldas(map: maplibregl.Map, features: CeldaMapa[]) {
  const data: GeoJSON.FeatureCollection<GeoJSON.Polygon, CeldaMapa['properties']> = {
    type: 'FeatureCollection',
    features,
  };
  const source = map.getSource<maplibregl.GeoJSONSource>(ID_CELDAS);
  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(ID_CELDAS, { type: 'geojson', data });
  map.addLayer({
    id: ID_CELDAS,
    type: 'fill',
    source: ID_CELDAS,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.88,
      'fill-outline-color': 'rgba(8, 18, 16, 0.65)',
    },
  });
  map.addLayer({
    id: ID_ESTIMADAS,
    source: ID_CELDAS,
    type: 'line',
    minzoom: 5,
    filter: ['==', ['get', 'estimado'], true],
    paint: { 'line-color': '#FFF2D7', 'line-opacity': 0.85, 'line-width': 1, 'line-dasharray': [2, 2] },
  });
}

export function celdaEnPunto(map: maplibregl.Map, point: maplibregl.Point): number | undefined {
  if (!map.getLayer(ID_CELDAS)) return undefined;
  const id = map.queryRenderedFeatures(point, { layers: [ID_CELDAS] })[0]?.id;
  return typeof id === 'number' ? id : undefined;
}
