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
