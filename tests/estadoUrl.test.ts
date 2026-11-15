import { describe, it, expect } from 'vitest';
import { escribirEstado, leerEstado, zonaDeClave, claveDeZona } from '../src/app/estadoUrl';
import { ZONA_ARGENTINA, zonaDeRegion, type Provincia } from '../src/api';

const provincias: Provincia[] = [
  { provincia_id: '74', nombre: 'San Luis', region: 'Cuyo', bbox: [-67.4, -36, -64.9, -31.8], geometria: null },
  { provincia_id: '70', nombre: 'San Juan', region: 'Cuyo', bbox: [-70.6, -32.6, -66.7, -28.4], geometria: null },
  { provincia_id: '14', nombre: 'Córdoba', region: 'Pampeana', bbox: [-65.8, -35, -61.8, -29.5], geometria: null },
];

describe('leerEstado', () => {
  it('lee zona, rango, capa y mes del mapa', () => {
    expect(leerEstado('?zona=prov:74&desde=2018-01&hasta=2024-12&capa=modis&mes=2024-08&lang=es')).toEqual({
      zona: 'prov:74',
      desde: '2018-01',
      hasta: '2024-12',
      capa: 'modis',
      mes: '2024-08',
    });
  });

  it('ignora valores con formato inválido', () => {
    expect(leerEstado('?zona=hack:1&desde=2018&hasta=2024-13&capa=xyz&mes=ayer')).toEqual({});
  });

  it('descarta un rango invertido', () => {
    expect(leerEstado('?desde=2024-01&hasta=2018-01')).toEqual({});
  });

  it('resuelve el paso inicial de cada guía y conserva enlaces de Córdoba', () => {
    expect(leerEstado('?caso=la-pampa&paso=calendario').guia).toEqual({ caso: 'la-pampa', paso: 'contexto' });
    expect(leerEstado('?zona=sierras-cordoba&caso=sierras-cordoba&paso=calendario')).toEqual({
      zona: 'prov:14',
      guia: { caso: 'sierras-cordoba', paso: 'calendario' },
    });
  });
});

describe('escribirEstado', () => {
  it('conserva parámetros ajenos (lang) y omite los valores por defecto', () => {
    const q = escribirEstado('?lang=es&zona=prov:14', { zona: 'arg', capa: 'armonizado' });
    expect(q).toBe('?lang=es');
  });

  it('escribe todos los valores elegidos', () => {
    const q = escribirEstado('?lang=es', {
      zona: 'region:Cuyo',
      desde: '2018-01',
      hasta: '2024-12',
      capa: 'viirs',
      mes: '2024-08',
    });
    expect(new URLSearchParams(q).get('zona')).toBe('region:Cuyo');
    expect(leerEstado(q)).toEqual({ zona: 'region:Cuyo', desde: '2018-01', hasta: '2024-12', capa: 'viirs', mes: '2024-08' });
  });

  it('conserva la vista de La Pampa al compartir y salir de la guía', () => {
    const vista = { zona: 'prov:42', desde: '2000-11', hasta: '2001-01', capa: 'viirs', mes: '2001-01' } as const;
    const guia = { caso: 'la-pampa', paso: 'viirs' } as const;
    const q = escribirEstado('?lang=es', { ...vista, guia });
    expect(leerEstado(q)).toEqual({ ...vista, guia });
    expect(leerEstado(escribirEstado(q, vista))).toEqual(vista);
  });
});

describe('zonas en la URL', () => {
  it('ida y vuelta para provincia, región, rectángulo y país', () => {
    const sanLuis = zonaDeClave('prov:74', provincias)!;
    expect(sanLuis).toMatchObject({ provincia_id: '74', nombre: 'San Luis' });
    expect(claveDeZona(sanLuis)).toBe('prov:74');

    const cuyo = zonaDeClave('region:Cuyo', provincias)!;
    expect(claveDeZona(cuyo)).toBe('region:Cuyo');
    expect(cuyo).toEqual(zonaDeRegion(provincias, 'Cuyo'));

    const rect = zonaDeClave('bbox:-66.6,-34,-65.8,-33', provincias)!;
    expect(rect.bbox).toEqual([-66.6, -34, -65.8, -33]);
    expect(claveDeZona(rect)).toBe('bbox:-66.6,-34,-65.8,-33');

    expect(claveDeZona(ZONA_ARGENTINA)).toBe('arg');
    expect(zonaDeClave('arg', provincias)).toBe(ZONA_ARGENTINA);
  });

  it('una provincia o región inexistente no resuelve', () => {
    expect(zonaDeClave('prov:99', provincias)).toBeNull();
    expect(zonaDeClave('region:Atlantida', provincias)).toBeNull();
    expect(zonaDeClave('bbox:1,2,3', provincias)).toBeNull();
  });
});
