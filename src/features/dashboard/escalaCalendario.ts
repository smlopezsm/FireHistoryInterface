/**
 * Escala de color del calendario (docs/02 §3): secuencial, de un solo tono.
 *
 * Por defecto los tramos se calculan **por zona y período** (quintiles de los meses con
 * focos, redondeados a números legibles), así una provincia chica y el país completo
 * aprovechan todos los colores. La escala **fija** sirve para comparar zonas entre sí.
 */

/** De oscuro a claro, un solo tono (ámbar quemado → naranja VIIRS). */
export const RAMPA = ['#3A2618', '#6A3519', '#A3461C', '#DB6127', '#FF9C55'] as const;
export const COLOR_CERO = '#0D1816';
export const COLOR_SIN_DATO = '#111E1B';

/** Cortes de la escala fija (focos por mes): geométricos, de provincia chica a país. */
export const CORTES_FIJOS = [50, 500, 2500, 10000];

// Escalones finos para que el redondeo no corra los tramos más de unos pocos meses.
const LINDOS = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10];

/** Redondea al número "lindo" más cercano (1, 1,5, 2, 2,5, 3, 4, 5, 6, 7,5 u 8 × 10ⁿ), en escala log. */
export function redondearLindo(valor: number): number {
  if (valor <= 0) return 0;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const candidatos = LINDOS.map((l) => l * potencia);
  return candidatos.reduce((mejor, c) =>
    Math.abs(Math.log(c / valor)) < Math.abs(Math.log(mejor / valor)) ? c : mejor,
  );
}

const redondearDosCifras = (valor: number) => {
  const potencia = 10 ** Math.max(0, Math.floor(Math.log10(valor)) - 1);
  return Math.round(valor / potencia) * potencia;
};

const cuantil = (ordenados: number[], p: number) => {
  const pos = (ordenados.length - 1) * p;
  const base = Math.floor(pos);
  const resto = pos - base;
  return ordenados[base] + (ordenados[base + 1] !== undefined ? resto * (ordenados[base + 1] - ordenados[base]) : 0);
};

/**
 * Cortes por zona: quintiles de los meses con focos (> 0). Devuelve hasta
 * `RAMPA.length - 1` cortes estrictamente crecientes; con pocos valores distintos,
 * menos (o ninguno).
 */
export function cortesPorZona(valores: (number | null)[]): number[] {
  const positivos = valores.filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b);
  if (new Set(positivos).size < 2) return [];
  const n = RAMPA.length;
  const cortes: number[] = [];
  for (let i = 1; i < n; i++) {
    const q = cuantil(positivos, i / n);
    // Primero un número lindo; si choca con el corte anterior, dos cifras significativas.
    let corte = redondearLindo(q);
    if (cortes.length && corte <= cortes[cortes.length - 1]) corte = redondearDosCifras(q);
    if (corte > 0 && (!cortes.length || corte > cortes[cortes.length - 1])) cortes.push(corte);
  }
  return cortes;
}

/** Índice del tramo: 0 si está por debajo del primer corte. */
export const tramoDeValor = (valor: number, cortes: number[]) => cortes.filter((c) => valor >= c).length;

export function colorDeValor(valor: number | null, cortes: number[]): string {
  if (valor === null) return COLOR_SIN_DATO;
  if (valor === 0) return COLOR_CERO;
  // Con menos cortes que colores se usan los tonos más claros (el último siempre es el máximo).
  const desfase = RAMPA.length - 1 - cortes.length;
  return RAMPA[desfase + tramoDeValor(valor, cortes)];
}

/** Colores en uso, del tramo más bajo al más alto (para la leyenda). */
export const coloresEnUso = (cortes: number[]) => RAMPA.slice(RAMPA.length - 1 - cortes.length);

/** Texto legible sobre un color de la rampa. */
export function textoSobre(color: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminancia = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminancia > 0.18 ? '#07100F' : '#EFF5ED';
}

const compacto = (v: number, locale: string) =>
  v >= 1000
    ? `${(v / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}k`
    : v.toLocaleString(locale, { maximumFractionDigits: 0 });

/** Etiquetas de cada tramo: "<5k", "5k–10k", …, "≥25k". */
export function etiquetasTramos(cortes: number[], locale: string): string[] {
  if (!cortes.length) return [];
  const f = (v: number) => compacto(v, locale);
  return [
    `<${f(cortes[0])}`,
    ...cortes.slice(1).map((c, i) => `${f(cortes[i])}–${f(c)}`),
    `≥${f(cortes[cortes.length - 1])}`,
  ];
}
