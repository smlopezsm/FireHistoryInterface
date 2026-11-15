import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { CalendarHeatmapWidget } from '../src/features/dashboard/CalendarHeatmapWidget';

describe('CalendarHeatmapWidget collapsible behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getCalendario').mockResolvedValue({
      zona: { tipo: 'pais', nombre: 'Argentina' },
      unidad: 'focos (escala VIIRS S-NPP)',
      meses: [
        {
          periodo: '2024-01',
          armonizado: 120,
          modis: 100,
          viirs: 120,
          estado: 'observado',
          confianza: 'alta',
        },
      ],
      resumen: {
        total: 120,
        max_mes: '2024-01',
        max_valor: 120,
        anios: 1,
      },
    } as any);
  });

  it('collapses and expands calendar content when toggle button is clicked', () => {
    render(
      <Providers>
        <CalendarHeatmapWidget
          zonaNombre="Argentina"
          capa="armonizado"
          pedido={null}
        />
      </Providers>
    );

    const toggleBtn = screen.getByRole('button', { name: /Collapse|Ocultar/i });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('calendar-heatmap-content')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('calendar-heatmap-content')).not.toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('calendar-heatmap-content')).toBeInTheDocument();
  });
});

describe('CalendarHeatmapWidget · escala de color', () => {
  const punto = (periodo: string, armonizado: number, confianza: 'alta' | 'media' | 'baja', estado = 'estimado') => ({
    periodo, armonizado, modis: 1, viirs: null, minimo: armonizado, maximo: armonizado,
    estado, frac_estimada: 1, confianza, parcial: false,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getCalendario').mockResolvedValue({
      zona: { tipo: 'provincia', id: '74' },
      unidad: 'focos (escala VIIRS S-NPP)',
      meses: [
        punto('2010-01', 300, 'alta'),
        punto('2010-02', 300, 'baja'),
        ...Array.from({ length: 10 }, (_, i) => punto(`2011-${String(i + 1).padStart(2, '0')}`, 10 * (i + 1) ** 2, 'media')),
      ],
      resumen: { total: 1, max_mes: '2010-01', max_anio: 2010, mediana_mensual: 1 },
    } as any);
  });

  const renderizar = () =>
    render(
      <Providers>
        <CalendarHeatmapWidget zonaNombre="San Luis" capa="armonizado" pedido={{ provincia_id: '74' }} />
      </Providers>
    );

  it('la confianza no cambia el color: mismo valor, mismo fondo', async () => {
    renderizar();
    const alta = await screen.findByRole('gridcell', { name: /Ene 2010|Jan 2010/ });
    const baja = screen.getByRole('gridcell', { name: /Feb 2010/ });
    expect(alta.style.backgroundColor).toBe(baja.style.backgroundColor);
    expect(alta.style.opacity).toBe('');
    expect(baja).toHaveAttribute('data-confianza', 'baja');
    expect(baja.getAttribute('aria-label')).toMatch(/confianza baja|low confidence/);
  });

  it('la leyenda muestra los cortes de la zona y se puede pasar a la escala fija', async () => {
    renderizar();
    await screen.findByRole('gridcell', { name: /Ene 2010|Jan 2010/ });
    const relativa = screen.getAllByTestId('tramo-leyenda').map((e) => e.textContent);
    expect(relativa).toHaveLength(5);
    expect(screen.queryByText('≥5k')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fija|Fixed/ }));
    const fija = screen.getAllByTestId('tramo-leyenda').map((e) => e.textContent?.replace(',', '.'));
    expect(fija).toEqual(['<50', '50–500', '500–2.5k', '2.5k–10k', '≥10k']);
  });
});
