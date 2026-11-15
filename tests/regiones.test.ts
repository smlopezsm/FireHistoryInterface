import { describe, it, expect } from 'vitest';
import { regionesDe, zonaDeRegion, pedidoDeZona, type Provincia } from '../src/api';

const cuadrado = (x: number, y: number, lado: number): number[][][][] => [
  [[[x, y], [x + lado, y], [x + lado, y + lado], [x, y + lado], [x, y]]],
];

const prov = (id: string, region: string, x: number): Provincia => ({
  provincia_id: id,
  nombre: `P${id}`,
  region,
  bbox: [x, -34, x + 1, -33],
  geometria: { type: 'MultiPolygon', coordinates: cuadrado(x, -34, 1) },
});

const provincias = [prov('01', 'Cuyo', -68), prov('02', 'Cuyo', -67), prov('03', 'NOA', -60)];

describe('regiones', () => {
  it('lista las regiones sin repetir y en orden', () => {
    expect(regionesDe(provincias)).toEqual(['Cuyo', 'NOA']);
  });

  it('arma una zona que viaja como `region=` (la API suma las celdas asignadas a sus provincias)', () => {
    const zona = zonaDeRegion(provincias, 'Cuyo');
    expect(zona.bbox).toEqual([-68, -34, -66, -33]);
    expect(zona.geometria).toBeUndefined();
    expect(pedidoDeZona(zona)).toEqual({ region: 'Cuyo' });
  });
});
