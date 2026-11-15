/**
 * Estado compartible en la URL (docs/02 §6):
 * `?zona=prov:74&desde=2018-01&hasta=2024-12&capa=armonizado&mes=2024-08&lang=es`.
 *
 * - `zona`: `arg` (país), `prov:<código INDEC>`, `region:<nombre>` o `bbox:o,s,e,n`.
 *   Los polígonos dibujados no se guardan.
 * - `desde`/`hasta`: rango del calendario y la serie. `mes`: mes del mapa.
 * Los valores con formato inválido se ignoran; los rangos se validan después contra
 * `/metadata` en el layout.
 */
import {
  ZONA_ARGENTINA,
  esZonaRegion,
  zonaDeRegion,
  zoomParaBbox,
  zonaDeBbox,
  validarBbox,
  type Capa,
  type Provincia,
  type ZonaSeleccionada,
} from '../api';

import { CLAVE_PROVINCIA_CORDOBA, ID_CASO_CORDOBA, PASOS_CASO, type PasoCordoba } from '../features/cordoba/caso';

export interface EstadoUrl {
  zona?: string;
  desde?: string;
  hasta?: string;
  capa?: Capa;
  mes?: string;
  pasoCordoba?: PasoCordoba;
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;
const ZONA = /^(arg|prov:\d{2}|region:[\p{L} ]{2,30}|bbox:-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3})$/u;
const CAPAS: Capa[] = ['armonizado', 'modis', 'viirs'];
const CLAVES = ['zona', 'desde', 'hasta', 'capa', 'mes', 'caso', 'paso'] as const;

export function leerEstado(busqueda: string): EstadoUrl {
  const q = new URLSearchParams(busqueda);
  const estado: EstadoUrl = {};
  const zona = q.get('zona');
  if (zona === ID_CASO_CORDOBA) estado.zona = CLAVE_PROVINCIA_CORDOBA;
  else if (zona && ZONA.test(zona)) estado.zona = zona;
  const desde = q.get('desde');
  const hasta = q.get('hasta');
  if (desde && hasta && MES.test(desde) && MES.test(hasta) && desde <= hasta) {
    estado.desde = desde;
    estado.hasta = hasta;
  }
  const capa = q.get('capa') as Capa | null;
  if (capa && CAPAS.includes(capa)) estado.capa = capa;
  const mes = q.get('mes');
  if (mes && MES.test(mes)) estado.mes = mes;
  if (q.get('caso') === ID_CASO_CORDOBA) {
    const paso = q.get('paso');
    estado.pasoCordoba = PASOS_CASO.find((valor) => valor === paso) ?? 'calendario';
  }
  return estado;
}

/** Devuelve la nueva query: conserva parámetros ajenos (como `lang`) y omite los valores por defecto. */
export function escribirEstado(busqueda: string, estado: EstadoUrl): string {
  const q = new URLSearchParams(busqueda);
  CLAVES.forEach((k) => q.delete(k));
  if (estado.zona && estado.zona !== 'arg') q.set('zona', estado.zona);
  if (estado.desde && estado.hasta) {
    q.set('desde', estado.desde);
    q.set('hasta', estado.hasta);
  }
  if (estado.capa && estado.capa !== 'armonizado') q.set('capa', estado.capa);
  if (estado.mes) q.set('mes', estado.mes);
  if (estado.pasoCordoba) {
    q.set('caso', ID_CASO_CORDOBA);
    q.set('paso', estado.pasoCordoba);
  }
  // `:` y `,` son válidos en la query: se dejan legibles (prov:74, bbox:-66.6,-34,…).
  const texto = q.toString().replace(/%3A/gi, ':').replace(/%2C/gi, ',');
  return texto ? `?${texto}` : '';
}

export function claveDeZona(zona: ZonaSeleccionada): string | null {
  if (zona.id === ZONA_ARGENTINA.id) return 'arg';
  if (zona.provincia_id) return `prov:${zona.provincia_id}`;
  if (esZonaRegion(zona)) return `region:${zona.region}`;
  if (zona.geometria) return null; // los polígonos dibujados no viajan en la URL
  if (zona.bbox) return `bbox:${zona.bbox.map((n) => Number(n.toFixed(4))).join(',')}`;
  return null;
}

export function zonaDeClave(clave: string, provincias: Provincia[]): ZonaSeleccionada | null {
  if (clave === 'arg') return ZONA_ARGENTINA;
  const [tipo, valor = ''] = [clave.slice(0, clave.indexOf(':')), clave.slice(clave.indexOf(':') + 1)];
  if (tipo === 'prov') {
    const p = provincias.find((x) => x.provincia_id === valor);
    if (!p) return null;
    return {
      id: p.provincia_id,
      provincia_id: p.provincia_id,
      nombre: p.nombre,
      region: p.region,
      center: [(p.bbox[0] + p.bbox[2]) / 2, (p.bbox[1] + p.bbox[3]) / 2],
      zoom: zoomParaBbox(p.bbox),
      bbox: p.bbox,
    };
  }
  if (tipo === 'region') {
    return provincias.some((p) => p.region === valor) ? zonaDeRegion(provincias, valor) : null;
  }
  if (tipo === 'bbox') {
    const [oeste, sur, este, norte, extra] = valor.split(',').map(Number);
    if (extra !== undefined) return null;
    const validada = validarBbox(oeste, sur, este, norte);
    return validada.ok ? zonaDeBbox(validada.bbox, 'Rectángulo', 'lat/lon') : null;
  }
  return null;
}
