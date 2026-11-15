import { describe, it, expect } from 'vitest';
import {
  COLOR_CERO,
  COLOR_SIN_DATO,
  CORTES_FIJOS,
  RAMPA,
  colorDeValor,
  cortesPorZona,
  etiquetasTramos,
  redondearLindo,
  tramoDeValor,
} from '../src/features/dashboard/escalaCalendario';

/** Reparto de valores por tramo, en fracción. */
const reparto = (valores: number[], cortes: number[]) => {
  const conteo = new Array(cortes.length + 1).fill(0);
  valores.forEach((v) => conteo[tramoDeValor(v, cortes)]++);
  return conteo.map((c) => c / valores.length);
};

// Distribución sesgada parecida a la nacional (de ~1k a ~100k focos por mes).
const nacional = Array.from({ length: 313 }, (_, i) => Math.round(950 * Math.pow(110, (i / 312) ** 1.6)));
// Y a una provincia chica (casi todo bajo 800, pocos picos de miles).
const provincial = Array.from({ length: 313 }, (_, i) => Math.round(2 * Math.pow(2700, (i / 312) ** 1.4)));

describe('redondearLindo', () => {
  it('redondea a escalones legibles por potencia de 10', () => {
    expect(redondearLindo(4898)).toBe(5000);
    expect(redondearLindo(7928)).toBe(8000);
    expect(redondearLindo(15656)).toBe(15000);
    expect(redondearLindo(27417)).toBe(30000);
    expect(redondearLindo(37)).toBe(40);
    expect(redondearLindo(1)).toBe(1);
  });
});

describe('cortesPorZona', () => {
  it.each([
    ['nacional', nacional],
    ['provincial', provincial],
  ])('ningún tramo concentra más del 30 %% de los meses (%s)', (_, valores) => {
    const cortes = cortesPorZona(valores);
    expect(cortes.length).toBe(RAMPA.length - 1);
    expect(Math.max(...reparto(valores, cortes))).toBeLessThanOrEqual(0.3);
  });

  it('los cortes son estrictamente crecientes', () => {
    const cortes = cortesPorZona(nacional);
    cortes.forEach((c, i) => i > 0 && expect(c).toBeGreaterThan(cortes[i - 1]));
  });

  it('ignora sin dato y ceros, y no inventa tramos con pocos valores distintos', () => {
    expect(cortesPorZona([null, 0, 0, 5, 5, 5] as (number | null)[])).toEqual([]);
    expect(cortesPorZona([])).toEqual([]);
  });
});

describe('colorDeValor', () => {
  const cortes = [10, 100, 1000, 10000];
  it('distingue sin dato, cero y cada tramo', () => {
    expect(colorDeValor(null, cortes)).toBe(COLOR_SIN_DATO);
    expect(colorDeValor(0, cortes)).toBe(COLOR_CERO);
    expect(colorDeValor(5, cortes)).toBe(RAMPA[0]);
    expect(colorDeValor(10, cortes)).toBe(RAMPA[1]);
    expect(colorDeValor(99_999, cortes)).toBe(RAMPA[4]);
  });

  it('la rampa es de un solo tono y va de oscuro a claro', () => {
    const luz = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    RAMPA.forEach((c, i) => i > 0 && expect(luz(c)).toBeGreaterThan(luz(RAMPA[i - 1])));
  });
});

describe('etiquetasTramos', () => {
  it('muestra los cortes reales que usa la escala', () => {
    expect(etiquetasTramos([5000, 10000, 20000, 25000], 'es-AR')).toEqual([
      '<5k',
      '5k–10k',
      '10k–20k',
      '20k–25k',
      '≥25k',
    ]);
    expect(etiquetasTramos([50, 250], 'es-AR')).toEqual(['<50', '50–250', '≥250']);
  });

  it('la escala fija tiene un tramo por color', () => {
    expect(CORTES_FIJOS).toHaveLength(RAMPA.length - 1);
  });
});
