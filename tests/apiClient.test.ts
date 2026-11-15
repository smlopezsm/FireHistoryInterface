import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getCalendario,
  getAnomalia,
  ApiRequestError,
  filenameFromDisposition,
  pedidoDeZona,
  rangoDelMes,
  mesAnterior,
  ZONA_ARGENTINA,
  validarBbox,
  bboxDePunto,
  zonaDeBbox,
} from '../src/api';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.restoreAllMocks());

describe('cliente de FireHistoryInterfaceAPI', () => {
  it('usa la ruta relativa /api/v1 y GET con query para provincia', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({ meses: [] }));
    await getCalendario({ provincia_id: '74' }, { desde: '2022-08', capa: 'armonizado' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/calendario?provincia_id=74&desde=2022-08&capa=armonizado');
    expect(init?.method).toBeUndefined();
    expect(init?.cache).toBe('no-cache'); // en desarrollo revalida contra el backend
  });

  it('usa POST con body JSON cuando la zona es un polígono', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({ mes: '2026-10' }));
    const geometria = { type: 'Polygon' as const, coordinates: [[[-66, -33], [-65, -33], [-65, -32], [-66, -33]]] };
    await getAnomalia({ geometria }, { mes: '2025-09' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/anomalia');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ geometria, mes: '2025-09' });
  });

  it('lanza ApiRequestError con el mensaje y el código de la API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { codigo: 'ZONA_INVALIDA', mensaje: 'Indicá una sola zona.', detalle: null } }),
        { status: 400 },
      ),
    );
    const err = await getCalendario({ bbox: '1,2,3,4' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect(err.message).toBe('Indicá una sola zona.');
    expect(err.codigo).toBe('ZONA_INVALIDA');
    expect(err.status).toBe(400);
  });

  it('toma el nombre del archivo de Content-Disposition', () => {
    expect(filenameFromDisposition('attachment; filename="focos_provincia-74_2025-09-01_2025-09-02.csv"')).toBe(
      'focos_provincia-74_2025-09-01_2025-09-02.csv',
    );
    expect(filenameFromDisposition(null)).toBeNull();
  });
});

describe('zona y fechas', () => {
  it('manda una sola zona: provincia, polígono o bbox', () => {
    expect(pedidoDeZona({ ...ZONA_ARGENTINA, provincia_id: '74' })).toEqual({ provincia_id: '74' });
    expect(pedidoDeZona(ZONA_ARGENTINA)).toEqual({ bbox: '-73.6,-55.1,-53.6,-21.8' });
  });

  it('calcula el rango de un mes recortado a los límites de datos', () => {
    expect(rangoDelMes('2024-02')).toEqual({ desde: '2024-02-01', hasta: '2024-02-29' });
    expect(rangoDelMes('2026-11', '2000-11-01', '2026-11-13')).toEqual({ desde: '2026-11-01', hasta: '2026-11-13' });
    expect(mesAnterior('2026-01')).toBe('2025-12');
  });
});

describe('zona por coordenadas', () => {
  it('valida un rectángulo y rechaza errores comunes', () => {
    expect(validarBbox(-67.4, -36, -64.9, -31.8)).toEqual({ ok: true, bbox: [-67.4, -36, -64.9, -31.8] });
    expect(validarBbox(-64.9, -36, -67.4, -31.8).ok).toBe(false); // oeste > este
    expect(validarBbox(-67.4, -31.8, -64.9, -36).ok).toBe(false); // sur > norte
    expect(validarBbox(10, 40, 12, 42).ok).toBe(false); // fuera de Argentina
    expect(validarBbox(NaN, -36, -64.9, -31.8).ok).toBe(false);
  });

  it('convierte punto y radio en un rectángulo', () => {
    const r = bboxDePunto(-33.3, -66.34, 50);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const [o, s, e, n] = r.bbox;
      expect(n - s).toBeCloseTo(100 / 111.32, 3);
      expect(e - o).toBeGreaterThan(n - s); // a -33° un grado de longitud mide menos
      expect((o + e) / 2).toBeCloseTo(-66.34, 3);
    }
    expect(bboxDePunto(-33.3, -66.34, 0).ok).toBe(false);
  });

  it('arma una zona que la API recibe como bbox', () => {
    const zona = zonaDeBbox([-67.4, -36, -64.9, -31.8], 'Rectángulo', 'lat/lon');
    expect(pedidoDeZona(zona)).toEqual({ bbox: '-67.4,-36,-64.9,-31.8' });
  });
});
