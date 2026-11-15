import type { BBox, GeoJSON, PedidoZona } from './types';

/** Extensión de Argentina continental + Tierra del Fuego (oeste, sur, este, norte). */
export const BBOX_ARGENTINA: BBox = [-73.6, -55.1, -53.6, -21.8];

/** Zona elegida en la interfaz (provincia, vista/bbox o polígono dibujado). */
export interface ZonaSeleccionada {
  id: string;
  nombre: string;
  region: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  provincia_id?: string;
  bbox?: BBox;
  geometria?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

/** Traduce la zona de la interfaz a la única zona que acepta la API. */
export function pedidoDeZona(zona: ZonaSeleccionada): PedidoZona | null {
  if (zona.provincia_id) return { provincia_id: zona.provincia_id };
  // Región completa: la API la resuelve con `region=` (ver regiones.ts).
  if (zona.id.startsWith('region-')) return { region: zona.region };
  if (zona.geometria) return { geometria: zona.geometria };
  if (zona.bbox) return { bbox: zona.bbox.join(',') };
  return null;
}

export const ZONA_ARGENTINA: ZonaSeleccionada = {
  id: 'arg',
  nombre: 'Argentina',
  region: 'Nacional',
  center: [-64, -38],
  zoom: 2.2,
  bbox: BBOX_ARGENTINA,
};

/** Zona a partir de un polígono dibujado: centro y zoom aproximados desde su extensión. */
export function zonaDePoligono(poligono: GeoJSON.Polygon, nombre: string, region: string): ZonaSeleccionada {
  const anillo = poligono.coordinates[0];
  const lngs = anillo.map((p) => p[0]);
  const lats = anillo.map((p) => p[1]);
  const bbox: BBox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
  return {
    id: `poligono-${Date.now()}`,
    nombre,
    region,
    center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
    zoom: zoomParaBbox(bbox),
    bbox,
    geometria: poligono,
  };
}

/** Zoom aproximado para que una extensión entre en el mapa. */
export function zoomParaBbox(bbox: BBox): number {
  const ancho = Math.max(bbox[2] - bbox[0], (bbox[3] - bbox[1]) * 1.3, 0.05);
  return Math.max(2.2, Math.min(10, Math.log2(360 / ancho) - 0.3));
}

// ── Fechas ──────────────────────────────────────────────────────────────

/** 'YYYY-MM-DD' → 'YYYY-MM' */
export const aMes = (fecha: string) => fecha.slice(0, 7);

/** Primer y último día de un mes 'YYYY-MM', recortado a [fechaMin, fechaMax]. */
export function rangoDelMes(mes: string, fechaMin?: string, fechaMax?: string): { desde: string; hasta: string } {
  const [y, m] = mes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let desde = `${mes}-01`;
  let hasta = `${mes}-${String(ultimo).padStart(2, '0')}`;
  if (fechaMin && desde < fechaMin) desde = fechaMin;
  if (fechaMax && hasta > fechaMax) hasta = fechaMax;
  return { desde, hasta };
}

/** Mes anterior a 'YYYY-MM'. */
export function mesAnterior(mes: string): string {
  const [y, m] = mes.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

// ── Zona ingresada a mano (lat/lon o bbox) ──────────────────────────────

const KM_POR_GRADO = 111.32;
const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

export type ResultadoBbox = { ok: true; bbox: BBox } | { ok: false; error: string };

/** Valida un rectángulo oeste, sur, este, norte (grados). */
export function validarBbox(oeste: number, sur: number, este: number, norte: number, isEn = false): ResultadoBbox {
  if ([oeste, sur, este, norte].some((n) => !Number.isFinite(n))) {
    return { ok: false, error: isEn ? 'Enter four numbers.' : 'Ingresá los cuatro números.' };
  }
  if (oeste < -180 || este > 180 || sur < -90 || norte > 90) {
    return { ok: false, error: isEn ? 'Longitude goes from −180 to 180 and latitude from −90 to 90.' : 'La longitud va de −180 a 180 y la latitud de −90 a 90.' };
  }
  if (oeste >= este) return { ok: false, error: isEn ? 'West must be smaller than east.' : 'El oeste tiene que ser menor que el este.' };
  if (sur >= norte) return { ok: false, error: isEn ? 'South must be smaller than north.' : 'El sur tiene que ser menor que el norte.' };
  const [aO, aS, aE, aN] = BBOX_ARGENTINA;
  if (este < aO || oeste > aE || norte < aS || sur > aN) {
    return { ok: false, error: isEn ? 'The area is outside Argentina.' : 'La zona queda fuera de Argentina.' };
  }
  return { ok: true, bbox: [r4(oeste), r4(sur), r4(este), r4(norte)] };
}

/** Rectángulo centrado en un punto con un radio en km. */
export function bboxDePunto(lat: number, lon: number, radioKm: number, isEn = false): ResultadoBbox {
  if (![lat, lon, radioKm].every(Number.isFinite)) {
    return { ok: false, error: isEn ? 'Enter latitude, longitude and radius.' : 'Ingresá latitud, longitud y radio.' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { ok: false, error: isEn ? 'Latitude goes from −90 to 90 and longitude from −180 to 180.' : 'La latitud va de −90 a 90 y la longitud de −180 a 180.' };
  }
  if (radioKm < 1 || radioKm > 1000) {
    return { ok: false, error: isEn ? 'Radius must be between 1 and 1000 km.' : 'El radio tiene que estar entre 1 y 1000 km.' };
  }
  const dLat = radioKm / KM_POR_GRADO;
  const dLon = radioKm / (KM_POR_GRADO * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return validarBbox(lon - dLon, lat - dLat, lon + dLon, lat + dLat, isEn);
}

/** Zona de la interfaz a partir de un rectángulo ingresado a mano. */
export function zonaDeBbox(bbox: BBox, nombre: string, region: string): ZonaSeleccionada {
  return {
    id: `bbox-${bbox.join('_')}`,
    nombre,
    region,
    center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
    zoom: zoomParaBbox(bbox),
    bbox,
  };
}
