import { describe, it, expect } from 'vitest';
import { geometriaDeRegion, regionesDe, zonaDeRegion, pedidoDeZona, type Provincia } from '../src/api';

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

  it('une las provincias vecinas en un solo contorno sin el borde compartido', async () => {
    const g = await geometriaDeRegion(provincias, 'Cuyo');
    const anillos = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    expect(anillos).toHaveLength(1);
    const xs = anillos[0][0].map((p) => p[0]);
    expect(Math.min(...xs)).toBeCloseTo(-68);
    expect(Math.max(...xs)).toBeCloseTo(-66);
  });

  it('arma una zona que viaja como geometría (POST)', async () => {
    const zona = await zonaDeRegion(provincias, 'Cuyo');
    expect(zona.bbox).toEqual([-68, -34, -66, -33]);
    expect(pedidoDeZona(zona)).toHaveProperty('geometria');
  });
});
