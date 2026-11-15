import { describe, it, expect } from 'vitest';
import {
  MIN_FOCOS_MAPA,
  TRAMOS_FOCOS,
  celdasAMarcadores,
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

describe('celdasAMarcadores', () => {
  it('ordena por focos, limita la cantidad dibujada e informa el total', () => {
    const features = Array.from({ length: 249 }, (_, i) => celda(i, 5 + i));
    const { marcadores, total } = celdasAMarcadores(features, { max: 60 });
    expect(total).toBe(249);
    expect(marcadores).toHaveLength(60);
    expect(marcadores[0].valor).toBe(5 + 248);
    expect(marcadores.every((m, i) => i === 0 || m.valor <= marcadores[i - 1].valor)).toBe(true);
  });

  it('filtra por provincia antes de contar', () => {
    const features = [celda(1, 20), celda(2, 30, { provincia_id: '42' })];
    const { marcadores, total } = celdasAMarcadores(features, { provinciaId: '74' });
    expect(total).toBe(1);
    expect(marcadores.map((m) => m.cellId)).toEqual([1]);
  });

  it('filtra por un conjunto de provincias (región)', () => {
    const features = [celda(1, 20), celda(2, 30, { provincia_id: '42' }), celda(3, 9, { provincia_id: '70' })];
    const { total, marcadores } = celdasAMarcadores(features, { provinciaIds: ['74', '70'] });
    expect(total).toBe(2);
    expect(marcadores.map((m) => m.cellId).sort()).toEqual([1, 3]);
  });

  it('usa el nombre de la provincia y conserva el estado de la celda', () => {
    const { marcadores } = celdasAMarcadores([celda(1, 20)], { nombres: new Map([['74', 'San Luis']]) });
    expect(marcadores[0]).toMatchObject({ provinciaNombre: 'San Luis', estado: 'estimado', valor: 20 });
    expect(marcadores[0]).not.toHaveProperty('brightness');
  });
});

describe('popupCeldaHtml', () => {
  const [marcador] = celdasAMarcadores([celda(7, 49)], { nombres: new Map([['74', 'San Luis']]) }).marcadores;

  it('muestra provincia, conteo, capa y estado, sin temperaturas ni sensores inventados', () => {
    const html = popupCeldaHtml(marcador, { capa: 'armonizado', isEn: false });
    expect(html).toContain('San Luis');
    expect(html).toContain('49 focos');
    expect(html).toContain('escala VIIRS S-NPP');
    expect(html).toContain('estimado desde MODIS');
    expect(html).not.toMatch(/\bK\b|[Bb]rillo|Brightness|Calibrad/);
    expect(html).toContain('https://www.google.com/maps?q=');
  });

  it('en capas crudas no habla de estado armonizado', () => {
    const html = popupCeldaHtml(marcador, { capa: 'modis', isEn: true });
    expect(html).toContain('49 hot spots');
    expect(html).toContain('MODIS');
    expect(html).not.toContain('estimated');
  });

  it('escapa el nombre de la provincia', () => {
    const [m] = celdasAMarcadores([celda(1, 9)], { nombres: new Map([['74', '<b>x</b>']]) }).marcadores;
    expect(popupCeldaHtml(m, { capa: 'armonizado', isEn: false })).not.toContain('<b>x</b>');
  });
});

describe('textoContador', () => {
  it('dice cuántas celdas se dibujan sobre el total', () => {
    expect(textoContador(60, 249, '2026-10', false)).toBe('60 de 249 celdas · 2026-10');
    expect(textoContador(60, 249, '2026-10', true)).toBe('60 of 249 cells · 2026-10');
  });

  it('cuando se dibujan todas, muestra solo el total', () => {
    expect(textoContador(12, 12, '2026-10', false)).toBe('12 celdas · 2026-10');
  });
});
