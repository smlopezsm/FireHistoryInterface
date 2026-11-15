import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { SeriesWidget } from '../src/features/dashboard/SeriesWidget';
import type { PedidoZona, SerieResponse } from '../src/api/types';
import { soloCambiaGranularidad } from '../src/api/useZonaQueries';

const serie = (valor: number, periodos = ['2022', '2023', '2024']): SerieResponse =>
  ({
    zona: { tipo: 'bbox', id: null, bbox: null, celdas: 1, area_km2: 1 },
    granularidad: 'anio',
    puntos: periodos.map((periodo) => ({
      periodo,
      modis: 1,
      viirs: valor,
      armonizado: valor,
      minimo: valor,
      maximo: valor,
      estado: 'observado',
      frac_estimada: 0,
      confianza: 'alta',
      parcial: false,
    })),
  }) as unknown as SerieResponse;

const ARGENTINA: PedidoZona = { bbox: '-73.6,-55.1,-53.6,-21.8' };
const SAN_LUIS: PedidoZona = { provincia_id: '74' };
const nunca = () => new Promise<SerieResponse>(() => {});

const ui = (pedido: PedidoZona, zonaNombre: string) => (
  <Providers>
    <SeriesWidget zonaNombre={zonaNombre} capa="armonizado" pedido={pedido} />
  </Providers>
);

describe('SeriesWidget · la curva corresponde siempre a su encabezado', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('al cambiar de zona no deja visible la curva de la zona anterior', async () => {
    const getSerie = vi.spyOn(api, 'getSerie').mockResolvedValueOnce(serie(400_000)).mockImplementation(nunca);
    const { rerender } = render(ui(ARGENTINA, 'Argentina'));
    expect(await screen.findByText('400k')).toBeInTheDocument();

    rerender(ui(SAN_LUIS, 'San Luis'));

    await waitFor(() => expect(getSerie).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('400k')).not.toBeInTheDocument();
    expect(screen.getByText(/Cargando San Luis…|Loading San Luis…/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Serie temporal|Time series/ })).toHaveAttribute('aria-busy', 'true');
  });

  it('al cambiar de capa tampoco reutiliza la curva anterior', async () => {
    vi.spyOn(api, 'getSerie').mockResolvedValueOnce(serie(400_000)).mockImplementation(nunca);
    const { rerender } = render(ui(ARGENTINA, 'Argentina'));
    expect(await screen.findByText('400k')).toBeInTheDocument();

    rerender(
      <Providers>
        <SeriesWidget zonaNombre="Argentina" capa="modis" pedido={ARGENTINA} />
      </Providers>,
    );
    await waitFor(() => expect(screen.queryByText('400k')).not.toBeInTheDocument());
    expect(screen.getByText(/Cargando Argentina…|Loading Argentina…/)).toBeInTheDocument();
  });

  it('al cambiar solo la granularidad conserva la curva, atenuada y marcada como actualizándose', async () => {
    vi.spyOn(api, 'getSerie').mockResolvedValueOnce(serie(400_000)).mockImplementation(nunca);
    render(ui(ARGENTINA, 'Argentina'));
    expect(await screen.findByText('400k')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mensual|Monthly/ }));

    expect(screen.getByText('400k')).toBeInTheDocument();
    const grafico = screen.getByRole('img', { name: /Focos por|Fire spots per/ });
    expect(grafico).toHaveAttribute('data-desactualizado', 'true');
    expect(grafico).toHaveAccessibleName(/por año|per year/);
    expect(screen.getByRole('region', { name: /Serie temporal|Time series/ })).toHaveAttribute('aria-busy', 'true');
  });
});

describe('soloCambiaGranularidad', () => {
  const zona: PedidoZona = { provincia_id: '74' };
  const clave = (z: PedidoZona | null, p: object) => ['serie', z, p] as const;

  it('solo es verdadero si zona, período y capa coinciden', () => {
    const base = { desde: '2018-01', hasta: '2024-12', capa: 'armonizado' as const };
    expect(soloCambiaGranularidad(clave(zona, { ...base, granularidad: 'anio' }), zona, { ...base, granularidad: 'mes' })).toBe(true);
    expect(soloCambiaGranularidad(clave(zona, base), { provincia_id: '14' }, base)).toBe(false);
    expect(soloCambiaGranularidad(clave(zona, base), zona, { ...base, desde: '2019-01' })).toBe(false);
    expect(soloCambiaGranularidad(clave(zona, base), zona, { ...base, capa: 'viirs' })).toBe(false);
    expect(soloCambiaGranularidad(undefined, zona, base)).toBe(false);
  });
});
