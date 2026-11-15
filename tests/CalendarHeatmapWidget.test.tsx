import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { CalendarHeatmapWidget } from '../src/features/dashboard/CalendarHeatmapWidget';
import { PROVINCIAS_ARG } from '../src/features/dashboard/ZoneSelectorWidget';

describe('CalendarHeatmapWidget Filters & Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getCalendario').mockResolvedValue({
      zona: { tipo: 'bbox', bbox: [-73.6, -55.1, -53.6, -21.8], celdas: 100, area_km2: 2780000 },
      capa: 'armonizado',
      unidad: 'focos',
      data_version: '2026-11-14T17:49:45-03:00',
      meses: [
        {
          periodo: '2026-09',
          armonizado: 320,
          modis: 120,
          viirs: 310,
          estado: 'observado',
          frac_estimada: 0,
          confianza: 'alta',
          minimo: 280,
          maximo: 360,
        },
        {
          periodo: '2024-09',
          armonizado: 1450,
          modis: 610,
          viirs: 1400,
          estado: 'observado',
          frac_estimada: 0,
          confianza: 'alta',
          minimo: 1200,
          maximo: 1650,
        },
      ],
      resumen: {
        total: 1770,
        max_mes: '2024-09',
        max_anio: 2024,
        mediana_mensual: 885,
      },
    });
  });

  it('filters years using modern preset pills and queries API with desde/hasta', async () => {
    render(
      <Providers>
        <CalendarHeatmapWidget
          zonaNombre="Argentina (Completa)"
          capa="armonizado"
          bbox={[-73.6, -55.1, -53.6, -21.8]}
        />
      </Providers>
    );

    await waitFor(() => {
      expect(api.getCalendario).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: '2000-01-01',
          hasta: '2026-12-31',
        })
      );
    });

    const fiveYearBtn = screen.getByRole('button', { name: '5y' });
    fireEvent.click(fiveYearBtn);

    expect(fiveYearBtn).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => {
      expect(api.getCalendario).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: '2022-01-01',
          hasta: '2026-12-31',
        })
      );
    });
  });

  it('allows selecting a zone directly from the calendar header', () => {
    const onSelectZone = vi.fn();
    render(
      <Providers>
        <CalendarHeatmapWidget
          zonaNombre="Argentina (Completa)"
          capa="armonizado"
          bbox={[-73.6, -55.1, -53.6, -21.8]}
          selectedZone={PROVINCIAS_ARG[0]}
          onSelectZone={onSelectZone}
        />
      </Providers>
    );

    const zoneSelect = screen.getByLabelText(/Calendar zone|Zona del calendario/i);
    fireEvent.change(zoneSelect, { target: { value: 'cordoba' } });

    expect(onSelectZone).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cordoba',
        provincia_id: '14',
      })
    );
  });

  it('selects a specific month when clicking a heatmap cell or using modern dropdowns', async () => {
    const onSelectMonth = vi.fn();
    render(
      <Providers>
        <CalendarHeatmapWidget
          zonaNombre="Argentina (Completa)"
          capa="armonizado"
          bbox={[-73.6, -55.1, -53.6, -21.8]}
          onSelectMonth={onSelectMonth}
        />
      </Providers>
    );

    await waitFor(() => {
      expect(api.getCalendario).toHaveBeenCalled();
    });

    const cell = screen.getByRole('gridcell', { name: /Sep 2024/i });
    fireEvent.click(cell);

    expect(onSelectMonth).toHaveBeenCalledWith('2024-09');
    expect(cell).toHaveAttribute('aria-selected', 'true');

    const monthSelect = screen.getByLabelText(/Focus month|Mes puntual/i);
    fireEvent.change(monthSelect, { target: { value: '0' } }); // Jan
    expect(onSelectMonth).toHaveBeenCalledWith('2024-01');
  });
});
