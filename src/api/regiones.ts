import type { BBox, Provincia } from './types';
import { zoomParaBbox, type ZonaSeleccionada } from './zona';

/**
 * Regiones (NOA, NEA, Cuyo, Pampeana, Patagonia). La API las acepta directamente con
 * `region=`: suma las celdas asignadas a sus provincias, así que el resultado coincide
 * con la suma por provincia y no hace falta unir contornos en el navegador.
 */

/** Regiones presentes en /provincias, en orden alfabético. */
export const regionesDe = (provincias: Provincia[]) =>
  Array.from(new Set(provincias.map((p) => p.region))).sort((a, b) => a.localeCompare(b, 'es'));

/** Zona de la interfaz para una región completa. */
export function zonaDeRegion(provincias: Provincia[], region: string): ZonaSeleccionada {
  const deRegion = provincias.filter((p) => p.region === region);
  const bbox: BBox = [
    Math.min(...deRegion.map((p) => p.bbox[0])),
    Math.min(...deRegion.map((p) => p.bbox[1])),
    Math.max(...deRegion.map((p) => p.bbox[2])),
    Math.max(...deRegion.map((p) => p.bbox[3])),
  ];
  return {
    id: `region-${region}`,
    nombre: `Región ${region}`,
    region,
    center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
    zoom: zoomParaBbox(bbox),
    bbox,
  };
}

export const esZonaRegion = (z: ZonaSeleccionada) => z.id.startsWith('region-');
