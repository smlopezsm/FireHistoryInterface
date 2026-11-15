/**
 * Celdas del mapa: de la respuesta de `/mapa/celdas` a polígonos interactivos.
 *
 * El mapa muestra **conteos de focos** por celda de 5 × 5 km en el mes elegido. No hay
 * temperaturas ni sensores deducidos: el color sale del conteo de la capa activa y el
 * popup informa provincia, conteo, capa y estado (observado o estimado desde MODIS).
 */
import type { CeldaProps, Estado } from '../../api/types';

export type CeldaFeature = GeoJSON.Feature<GeoJSON.Polygon, CeldaProps>;
export type CapaMapa = 'armonizado' | 'modis' | 'viirs';

/** Focos mínimos por celda que se piden a la API (`min_focos`). */
export const MIN_FOCOS_MAPA = 5;

export interface TramoFocos {
  desde: number;
  /** `null` = sin tope. */
  hasta: number | null;
  color: string;
}

/** Tramos de focos por celda y mes. Secuencial de un solo tono (ámbar → rojo). */
export const TRAMOS_FOCOS: TramoFocos[] = [
  { desde: MIN_FOCOS_MAPA, hasta: 9, color: '#FFC46B' },
  { desde: 10, hasta: 24, color: '#FF9C55' },
  { desde: 25, hasta: 49, color: '#FF6759' },
  { desde: 50, hasta: null, color: '#D62F2F' },
];

export const colorDeConteo = (valor: number): string => {
  // Los valores armonizados tienen decimales: un tramo cubre hasta el inicio del siguiente.
  for (let i = TRAMOS_FOCOS.length - 1; i >= 0; i--) {
    if (valor >= TRAMOS_FOCOS[i].desde) return TRAMOS_FOCOS[i].color;
  }
  return TRAMOS_FOCOS[0].color;
};

export const etiquetaTramo = (tramo: TramoFocos, isEn: boolean): string => {
  const unidad = isEn ? 'hot spots' : 'focos';
  return tramo.hasta === null ? `≥${tramo.desde} ${unidad}` : `${tramo.desde}–${tramo.hasta} ${unidad}`;
};

interface DetalleCelda {
  cellId: number;
  lng: number;
  lat: number;
  valor: number;
  estado: Estado;
  provinciaNombre: string | null;
}

export type CeldaMapa = GeoJSON.Feature<GeoJSON.Polygon, DetalleCelda & {
  color: string;
  estimado: boolean;
}>;

interface OpcionesCeldas {
  capa?: CapaMapa;
  /** Si se indica, solo cuentan las celdas asignadas a esa provincia. */
  provinciaId?: string;
  /** Si se indica (una región), solo cuentan las celdas de esas provincias. */
  provinciaIds?: string[];
  /** Filtro espacial adicional (por ejemplo, el polígono de una región). */
  dentro?: (lng: number, lat: number) => boolean;
  /** `provincia_id` → nombre, para el popup. */
  nombres?: Map<string, string>;
}

const centroide = (f: CeldaFeature): [number, number] | null => {
  const anillo = f.geometry?.coordinates?.[0] ?? [];
  // El anillo GeoJSON repite el primer vértice al final: no lo contamos dos veces.
  const vertices =
    anillo.length > 1 && anillo[0][0] === anillo.at(-1)![0] && anillo[0][1] === anillo.at(-1)![1]
      ? anillo.slice(0, -1)
      : anillo;
  if (!vertices.length || vertices.some(([lng, lat]) => !Number.isFinite(lng) || !Number.isFinite(lat))) return null;
  const [sx, sy] = vertices.reduce(([x, y], [lng, lat]) => [x + lng, y + lat], [0, 0]);
  return [Number((sx / vertices.length).toFixed(4)), Number((sy / vertices.length).toFixed(4))];
};

/** Conserva la geometría y el valor de cada celda devuelta para la zona seleccionada. */
export function celdasParaMapa(
  features: CeldaFeature[],
  { capa = 'armonizado', provinciaId, provinciaIds, dentro, nombres }: OpcionesCeldas = {},
): CeldaMapa[] {
  return features
    .filter((f) => !provinciaId || f.properties.provincia_id === provinciaId)
    .filter((f) => !provinciaIds?.length || provinciaIds.includes(f.properties.provincia_id ?? ''))
    .flatMap((f): CeldaMapa[] => {
      const centro = centroide(f);
      if (!centro || (dentro && !dentro(...centro))) return [];
      const [lng, lat] = centro;
      const { cell_id, provincia_id, valor, estado } = f.properties;
      return [{
        type: 'Feature',
        id: cell_id,
        geometry: f.geometry,
        properties: {
          cellId: cell_id,
          lng,
          lat,
          valor,
          estado,
          provinciaNombre: (provincia_id && nombres?.get(provincia_id)) || null,
          color: colorDeConteo(valor),
          estimado: capa === 'armonizado' && estado !== 'observado',
        },
      }];
    });
}

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const ESTADOS: Record<Estado, [string, string]> = {
  observado: ['observed (VIIRS)', 'observado (VIIRS)'],
  estimado: ['estimated from MODIS', 'estimado desde MODIS'],
  mixto: ['partly estimated from MODIS', 'en parte estimado desde MODIS'],
};

export function popupCeldaHtml(m: DetalleCelda, { capa, isEn }: { capa: CapaMapa; isEn: boolean }): string {
  const locale = isEn ? 'en' : 'es-AR';
  const conteo = m.valor.toLocaleString(locale, { maximumFractionDigits: 1 });
  const unidad = isEn ? 'hot spots' : 'focos';
  const lugar = m.provinciaNombre ?? (isEn ? `Cell ${m.cellId}` : `Celda ${m.cellId}`);
  const capaTexto =
    capa === 'armonizado' ? (isEn ? 'harmonized, VIIRS S-NPP scale' : 'armonizado, escala VIIRS S-NPP') : capa.toUpperCase();
  const estado = capa === 'armonizado' ? ESTADOS[m.estado]?.[isEn ? 0 : 1] : null;
  const coords = `${m.lat.toFixed(4)},${m.lng.toFixed(4)}`;
  const color = colorDeConteo(m.valor);

  return `
    <div style="font-family: 'DM Mono', monospace; font-size: 12px; padding: 6px; color: #EFF5ED; background: #0D1816; border: 1px solid #21312D; border-radius: 4px;">
      <strong style="color: ${color};">${escapar(lugar)}</strong><br/>
      <span><b>${conteo} ${unidad}</b> · ${capaTexto}</span><br/>
      ${estado ? `<span style="color: #93A39C; font-size: 11px;">${estado}</span><br/>` : ''}
      <a href="https://www.google.com/maps?q=${coords}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 3px; color: #B8EE68; text-decoration: underline; font-size: 11px;">
        ${isEn ? 'Cell center' : 'Centro de la celda'} · ${m.lat.toFixed(4)}, ${m.lng.toFixed(4)} · Google Maps ↗
      </a>
    </div>
  `;
}

export function textoContador(total: number, isEn: boolean): string {
  const celdas = total === 1 ? (isEn ? 'cell' : 'celda') : (isEn ? 'cells' : 'celdas');
  return `${total} ${celdas}`;
}
