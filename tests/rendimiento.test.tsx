import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useState } from 'react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { useMapaCeldas, type MapaCeldasParams } from '../src/api';
import { CargarAlVer } from '../src/app/CargarAlVer';

const vacio = { type: 'FeatureCollection', features: [] } as const;
const params = (mes: string): MapaCeldasParams => ({
  bbox: '-73.6,-55.1,-53.6,-21.8',
  desde: `${mes}-01`,
  hasta: `${mes}-28`,
  capa: 'armonizado',
  min_focos: 5,
});

let cambiarMes: (mes: string) => void = () => {};
function Mapa({ inicial }: { inicial: string }) {
  const [mes, setMes] = useState(inicial);
  cambiarMes = setMes;
  const { data, isFetching } = useMapaCeldas(params(mes));
  return <div data-testid="estado">{isFetching ? 'cargando' : `${data?.features.length ?? '-'}`}</div>;
}

describe('useMapaCeldas', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('volver a un mes ya visto no repite la petición (caché)', async () => {
    const get = vi.spyOn(api, 'getMapaCeldas').mockResolvedValue(vacio as any);
    render(<Providers><Mapa inicial="2024-01" /></Providers>);
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('0'));
    for (const mes of ['2024-02', '2024-03', '2024-01']) {
      act(() => cambiarMes(mes));
      await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('0'));
    }
    const pedidos = get.mock.calls.map(([p]) => p.desde);
    expect(pedidos).toEqual(['2024-01-01', '2024-02-01', '2024-03-01']);
  });

  it('la petición que queda obsoleta se cancela', async () => {
    const señales: AbortSignal[] = [];
    vi.spyOn(api, 'getMapaCeldas').mockImplementation((_p, signal) => {
      señales.push(signal!);
      return new Promise(() => {});
    });
    render(<Providers><Mapa inicial="2024-01" /></Providers>);
    await waitFor(() => expect(señales).toHaveLength(1));
    act(() => cambiarMes('2024-02'));
    await waitFor(() => expect(señales).toHaveLength(2));
    expect(señales[0].aborted).toBe(true);
    expect(señales[1].aborted).toBe(false);
  });

  it('sin parámetros (sin metadata) no pide nada', () => {
    const get = vi.spyOn(api, 'getMapaCeldas').mockResolvedValue(vacio as any);
    function SinParams() {
      useMapaCeldas(null);
      return null;
    }
    render(<Providers><SinParams /></Providers>);
    expect(get).not.toHaveBeenCalled();
  });
});

describe('CargarAlVer', () => {
  let observar: ((visible: boolean) => void) | null = null;
  const original = globalThis.IntersectionObserver;

  beforeEach(() => {
    observar = null;
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        observar = (visible) => cb([{ isIntersecting: visible } as IntersectionObserverEntry], this as any);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    } as any;
  });
  afterEach(() => {
    globalThis.IntersectionObserver = original;
  });

  it('muestra el esqueleto hasta que el contenedor entra en pantalla', () => {
    render(<CargarAlVer esqueleto={<p>esqueleto</p>}><p>mapa</p></CargarAlVer>);
    expect(screen.getByText('esqueleto')).toBeInTheDocument();
    expect(screen.queryByText('mapa')).not.toBeInTheDocument();
    act(() => observar!(true));
    expect(screen.getByText('mapa')).toBeInTheDocument();
  });

  it('sin IntersectionObserver carga enseguida', () => {
    globalThis.IntersectionObserver = undefined as any;
    render(<CargarAlVer esqueleto={<p>esqueleto</p>}><p>mapa</p></CargarAlVer>);
    expect(screen.getByText('mapa')).toBeInTheDocument();
  });
});
