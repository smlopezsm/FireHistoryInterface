import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { MainLayout } from '../src/app/layout/MainLayout';

// El globo real necesita WebGL: acá alcanza con ver qué mes recibe.
vi.mock('../src/features/globe', () => ({
  GloboTerraqueo: (props: { month?: string; mesDesde?: string; mesHasta?: string }) => (
    <div data-testid="globo" data-mes={props.month} data-desde={props.mesDesde} data-hasta={props.mesHasta} />
  ),
}));

const provincias = [
  { provincia_id: '74', nombre: 'San Luis', region: 'Cuyo', bbox: [-67.4, -36, -64.9, -31.8], geometria: null },
  { provincia_id: '70', nombre: 'San Juan', region: 'Cuyo', bbox: [-70.6, -32.6, -66.7, -28.4], geometria: null },
];

const metadata = {
  fecha_min: '2000-11-01',
  fecha_max: '2026-11-13',
  fecha_ultimo_sp: '2026-08-31',
  data_version: 'x',
  referencia_viirs: [],
};

const calendario = {
  zona: { tipo: 'provincia', id: '74' },
  unidad: 'focos (escala VIIRS S-NPP)',
  meses: ['2024-07', '2024-08'].map((periodo) => ({
    periodo, armonizado: 10, modis: 1, viirs: 10, minimo: 10, maximo: 10,
    estado: 'observado', frac_estimada: 0, confianza: 'alta', parcial: false,
  })),
  resumen: { total: 20, max_mes: '2024-08', max_anio: 2024, mediana_mensual: 10 },
};

const irA = (query: string) => window.history.replaceState(null, '', `/${query}`);

describe('MainLayout · estado en la URL', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getMetadata').mockResolvedValue(metadata as any);
    vi.spyOn(api, 'getProvincias').mockResolvedValue(provincias as any);
    vi.spyOn(api, 'getCalendario').mockResolvedValue(calendario as any);
    vi.spyOn(api, 'getSerie').mockResolvedValue({ zona: calendario.zona, granularidad: 'anio', puntos: [] } as any);
    vi.spyOn(api, 'getAnomalia').mockImplementation(async (_zona, { mes } = {}) =>
      ({ mes, valor: 1, categoria: null }) as any,
    );
    vi.spyOn(api, 'descargarCsv').mockResolvedValue('datos.csv');
  });
  afterEach(() => irA(''));

  it('restaura zona, rango, capa y mes del mapa desde una URL compartida', async () => {
    irA('?zona=prov:74&desde=2018-01&hasta=2024-12&capa=modis&mes=2024-08&lang=es');
    render(<Providers><MainLayout /></Providers>);

    await waitFor(() =>
      expect(api.getCalendario).toHaveBeenLastCalledWith(
        { provincia_id: '74' },
        expect.objectContaining({ desde: '2018-01', hasta: '2024-12', capa: 'modis' }),
        expect.anything(),
      ),
    );
    expect(screen.getAllByTestId('globo')[0]).toHaveAttribute('data-mes', '2024-08');
    expect(screen.getByTestId('globo')).toHaveAttribute('data-desde', '2018-01');
    expect(screen.getByTestId('globo')).toHaveAttribute('data-hasta', '2024-12');
    expect(api.getCalendario).toHaveBeenCalledTimes(1);
    // La URL se conserva (incluido lang).
    expect(new URLSearchParams(window.location.search).get('zona')).toBe('prov:74');
    expect(new URLSearchParams(window.location.search).get('lang')).toBe('es');
  });

  it('una región viaja como region= y queda en la URL', async () => {
    irA('?zona=region:Cuyo');
    render(<Providers><MainLayout /></Providers>);
    await waitFor(() => expect(api.getCalendario).toHaveBeenLastCalledWith({ region: 'Cuyo' }, expect.anything(), expect.anything()));
    expect(new URLSearchParams(window.location.search).get('zona')).toBe('region:Cuyo');
  });

  it('un mes inválido para el mapa o un rango fuera de los datos vuelven al valor por defecto', async () => {
    irA('?mes=2030-01&desde=1990-01&hasta=2024-12');
    render(<Providers><MainLayout /></Providers>);
    // Mes por defecto: el último mes completo (2026-10); rango: todo el registro.
    await waitFor(() => expect(screen.getAllByTestId('globo')[0]).toHaveAttribute('data-mes', '2026-10'));
    await waitFor(() => expect(new URLSearchParams(window.location.search).get('desde')).toBeNull());
  });

  it('clic en un mes del calendario lo abre en el mapa y lo guarda en la URL', async () => {
    irA('?zona=prov:74');
    render(<Providers><MainLayout /></Providers>);
    // Esperar a que la zona de la URL esté resuelta (el calendario se vuelve a pedir).
    await waitFor(() => expect(api.getCalendario).toHaveBeenLastCalledWith({ provincia_id: '74' }, expect.anything(), expect.anything()));
    await waitFor(() => expect(screen.getByRole('gridcell', { name: /Jul 2024/ })).toBeInTheDocument());
    const julio = screen.getByRole('gridcell', { name: /Jul 2024/ });
    fireEvent.click(julio);
    await waitFor(() => expect(screen.getAllByTestId('globo')[0]).toHaveAttribute('data-mes', '2024-07'));
    await waitFor(() => expect(api.getAnomalia).toHaveBeenLastCalledWith(
      { provincia_id: '74' }, { mes: '2024-07' }, expect.anything(),
    ));
    expect(new URLSearchParams(window.location.search).get('mes')).toBe('2024-07');
  });
  it('acota el mes al período y las descargas usan el alcance de cada vista', async () => {
    irA('?zona=prov:74&desde=2024-07&hasta=2024-08&mes=2024-09&capa=viirs');
    render(<Providers><MainLayout /></Providers>);

    await waitFor(() => expect(screen.getByTestId('globo')).toHaveAttribute('data-mes', '2024-08'));
    await waitFor(() => expect(new URLSearchParams(window.location.search).has('mes')).toBe(false));

    fireEvent.click(screen.getByText('Download CSV'));
    fireEvent.click(screen.getByRole('button', { name: /Calendar.*MODIS, VIIRS and harmonized/ }));
    await waitFor(() => expect(api.descargarCsv).toHaveBeenLastCalledWith(
      { provincia_id: '74' },
      { tipo: 'calendario', desde: '2024-07', hasta: '2024-08' },
      expect.any(String),
    ));

    const focos = screen.getByRole('button', { name: /Hot spots.*August 2024.*All sensors/ });
    await waitFor(() => expect(focos).toBeEnabled());
    fireEvent.click(focos);
    await waitFor(() => expect(api.descargarCsv).toHaveBeenLastCalledWith(
      { provincia_id: '74' },
      { tipo: 'focos', desde: '2024-08-01', hasta: '2024-08-31', sensor: 'todos' },
      expect.any(String),
    ));
  });

  it('muestra el mes parcial cuando es el único del período', async () => {
    irA('?desde=2026-11&hasta=2026-11');
    render(<Providers><MainLayout /></Providers>);
    await waitFor(() => expect(screen.getByTestId('globo')).toHaveAttribute('data-mes', '2026-11'));
    await waitFor(() => expect(api.getAnomalia).toHaveBeenLastCalledWith(
      expect.anything(), { mes: '2026-11' }, expect.anything(),
    ));
  });

});
