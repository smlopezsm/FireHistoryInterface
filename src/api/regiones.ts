import type { BBox, GeoJSON, Provincia } from './types';
import { zoomParaBbox, type ZonaSeleccionada } from './zona';

/**
 * La API no acepta "región" como zona: solo provincia_id, bbox o geometria.
 * Una región se consulta como `geometria`: la unión de los contornos de sus
 * provincias (de /provincias?geometria=true), limpia y con ≤ 2.000 vértices.
 *
 * Es una aproximación: la API asigna cada celda a una provincia por su
 * centro, mientras que la unión deja afuera algunas celdas del borde y
 * descarta islas muy chicas. Medido contra la suma por provincia: 1–5 %.
 */

const MAX_VERTICES = 2000;
/** Partes menores a ~20 km² (islotes) se descartan: suelen venir degeneradas. */
const AREA_MINIMA_GRADOS2 = 0.002;

type Anillo = number[][];
type Poligono = Anillo[];

const areaAnillo = (r: Anillo) =>
  Math.abs(
    r.reduce((a, [x1, y1], i) => {
      const [x2, y2] = r[(i + 1) % r.length];
      return a + x1 * y2 - x2 * y1;
    }, 0),
  ) / 2;

const contarVertices = (g: GeoJSON.Polygon | GeoJSON.MultiPolygon) =>
  (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).reduce(
    (a, p) => a + p.reduce((b, r) => b + r.length, 0),
    0,
  );

const poligonosDe = (g: GeoJSON.Polygon | GeoJSON.MultiPolygon): Poligono[] =>
  g.type === 'Polygon' ? [g.coordinates] : g.coordinates;

/** Unión de los contornos de las provincias de una región. */
export async function geometriaDeRegion(
  provincias: Provincia[],
  region: string,
): Promise<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  // Carga diferida: turf solo se descarga si alguien elige una región
  const [{ union }, { simplify }, { featureCollection, polygon }] = await Promise.all([
    import('@turf/union'),
    import('@turf/simplify'),
    import('@turf/helpers'),
  ]);

  const partes = provincias
    .filter((p) => p.region === region && p.geometria)
    .flatMap((p) => poligonosDe(p.geometria!))
    .map((poly) => poly.filter((r) => r.length >= 4))
    .filter((poly) => poly.length > 0 && areaAnillo(poly[0]) >= AREA_MINIMA_GRADOS2)
    .map((poly) => polygon(poly));

  if (partes.length === 0) throw new Error(`No hay contornos para la región ${region}.`);

  // Unir todo de una vez elimina los bordes compartidos entre provincias
  let unida = partes.length === 1 ? partes[0] : union(featureCollection(partes));
  if (!unida) throw new Error(`No se pudo unir la región ${region}.`);

  // Simplificar de a poco hasta entrar en el límite de vértices de la API
  let tolerancia = 0.002;
  unida = simplify(unida, { tolerance: tolerancia, highQuality: true });
  while (contarVertices(unida.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon) > MAX_VERTICES) {
    tolerancia *= 1.5;
    unida = simplify(unida, { tolerance: tolerancia, highQuality: true });
  }
  return unida.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

/** Regiones presentes en /provincias, en orden alfabético. */
export const regionesDe = (provincias: Provincia[]) =>
  Array.from(new Set(provincias.map((p) => p.region))).sort((a, b) => a.localeCompare(b, 'es'));

/** Zona de la interfaz para una región completa. */
export async function zonaDeRegion(provincias: Provincia[], region: string): Promise<ZonaSeleccionada> {
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
    geometria: await geometriaDeRegion(provincias, region),
  };
}

export const esZonaRegion = (z: ZonaSeleccionada) => z.id.startsWith('region-');
