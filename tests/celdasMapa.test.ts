import { describe, it, expect } from 'vitest';
import {
  MIN_FOCOS_MAPA,
  TRAMOS_FOCOS,
  celdasParaMapa,
  colorDeConteo,
  etiquetaTramo,
  popupCeldaHtml,
  textoContador,
  type CeldaFeature,
} from '../src/features/globe/celdasMapa';

const celda = (
  cell_id: number,
  valor: number,
  extra: Partial<CeldaFeature['properties']> = {},
): CeldaFeature => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[-66, -33], [-65, -33], [-65, -34], [-66, -34], [-66, -33]]],
  },
  properties: { cell_id, provincia_id: '74', modis: 10, viirs: null, estado: 'estimado', valor, ...extra },
});

describe('tramos de conteo del mapa', () => {
  it('asigna color por cantidad de focos y no por una temperatura', () => {
    expect(colorDeConteo(5)).toBe(TRAMOS_FOCOS[0].color);
    expect(colorDeConteo(9.9)).toBe(TRAMOS_FOCOS[0].color);
    expect(colorDeConteo(10)).toBe(TRAMOS_FOCOS[1].color);
    expect(colorDeConteo(49)).toBe(TRAMOS_FOCOS[2].color);
    expect(colorDeConteo(50)).toBe(TRAMOS_FOCOS[3].color);
  });

  it('los tramos empiezan en el mínimo que pide el mapa y son contiguos', () => {
    expect(TRAMOS_FOCOS[0].desde).toBe(MIN_FOCOS_MAPA);
    for (let i = 1; i < TRAMOS_FOCOS.length; i++) {
      expect(TRAMOS_FOCOS[i].desde).toBe((TRAMOS_FOCOS[i - 1].hasta as number) + 1);
    }
    expect(TRAMOS_FOCOS.at(-1)?.hasta).toBeNull();
  });

  it('etiqueta los tramos en focos', () => {
    expect(etiquetaTramo(TRAMOS_FOCOS[0], false)).toBe('5–9 focos');
    expect(etiquetaTramo(TRAMOS_FOCOS.at(-1)!, true)).toBe('≥50 hot spots');
  });
});

describe('celdasParaMapa', () => {
  it('omite celdas sin geometría utilizable', () => {
    const sinGeometria = celda(1, 20);
    sinGeometria.geometry.coordinates = [];
    expect(celdasParaMapa([sinGeometria])).toEqual([]);
  });

  it('conserva todos los polígonos y conteos de la API', () => {
    const features = Array.from({ length: 249 }, (_, i) => celda(i, 5 + i));
    const celdas = celdasParaMapa(features);
    expect(celdas).toHaveLength(249);
    expect(celdas[0].geometry).toEqual(features[0].geometry);
    expect(celdas[248].properties.valor).toBe(253);
    expect(celdas[0].properties.estimado).toBe(true);
    expect(celdasParaMapa(features, { capa: 'modis' })[0].properties.estimado).toBe(false);
  });

  it('filtra por provincia antes de contar', () => {
    const features = [celda(1, 20), celda(2, 30, { provincia_id: '42' })];
    const celdas = celdasParaMapa(features, { provinciaId: '74' });
    expect(celdas).toHaveLength(1);
    expect(celdas.map((m) => m.id)).toEqual([1]);
  });

  it('filtra por un conjunto de provincias (región)', () => {
    const features = [celda(1, 20), celda(2, 30, { provincia_id: '42' }), celda(3, 9, { provincia_id: '70' })];
    const celdas = celdasParaMapa(features, { provinciaIds: ['74', '70'] });
    expect(celdas).toHaveLength(2);
    expect(celdas.map((m) => m.id).sort()).toEqual([1, 3]);
  });

  it('usa el nombre de la provincia y conserva el estado de la celda', () => {
    const celdas = celdasParaMapa([celda(1, 20)], { nombres: new Map([['74', 'San Luis']]) });
    expect(celdas[0].properties).toMatchObject({ provinciaNombre: 'San Luis', estado: 'estimado', valor: 20 });
    expect(celdas[0].properties).not.toHaveProperty('brightness');
  });
});

describe('popupCeldaHtml', () => {
  const [marcador] = celdasParaMapa([celda(7, 49)], { nombres: new Map([['74', 'San Luis']]) });

  it('muestra provincia, conteo, capa y estado, sin temperaturas ni sensores inventados', () => {
    const html = popupCeldaHtml(marcador.properties, { capa: 'armonizado', isEn: false });
    expect(html).toContain('San Luis');
    expect(html).toContain('49 focos');
    expect(html).toContain('escala VIIRS S-NPP');
    expect(html).toContain('estimado desde MODIS');
    expect(html).not.toMatch(/\bK\b|[Bb]rillo|Brightness|Calibrad/);
    expect(html).toContain('https://www.google.com/maps?q=');
  });

  it('en capas crudas no habla de estado armonizado', () => {
    const html = popupCeldaHtml(marcador.properties, { capa: 'modis', isEn: true });
    expect(html).toContain('49 hot spots');
    expect(html).toContain('MODIS');
    expect(html).not.toContain('estimated');
  });

  it('escapa el nombre de la provincia', () => {
    const [m] = celdasParaMapa([celda(1, 9)], { nombres: new Map([['74', '<b>x</b>']]) });
    expect(popupCeldaHtml(m.properties, { capa: 'armonizado', isEn: false })).not.toContain('<b>x</b>');
  });
});

describe('textoContador', () => {
  it('dice cuántas celdas válidas se muestran', () => {
    expect(textoContador(249, false)).toBe('249 celdas');
    expect(textoContador(1, true)).toBe('1 cell');
  });
});
