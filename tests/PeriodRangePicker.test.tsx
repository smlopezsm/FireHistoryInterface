import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PeriodRangePicker } from '../src/features/dashboard/PeriodRangePicker';

describe('PeriodRangePicker', () => {
  it('applies quick period presets directly', () => {
    const onChangePeriodo = vi.fn();
    render(
      <PeriodRangePicker
        periodo={{ desde: '2000-11', hasta: '2026-11' }}
        onChangePeriodo={onChangePeriodo}
        mesMin="2000-11"
        mesMax="2026-11"
        isEn={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '1Y' }));
    expect(onChangePeriodo).toHaveBeenCalledWith({ desde: '2025-12', hasta: '2026-11' });

    fireEvent.click(screen.getByRole('button', { name: '5Y' }));
    expect(onChangePeriodo).toHaveBeenCalledWith({ desde: '2021-12', hasta: '2026-11' });
  });

  it('opens calendar popover, navigates years, and selects an ordered month range in two clicks', () => {
    const onChangePeriodo = vi.fn();
    render(
      <PeriodRangePicker
        periodo={{ desde: '2000-11', hasta: '2026-11' }}
        onChangePeriodo={onChangePeriodo}
        mesMin="2000-11"
        mesMax="2026-11"
        isEn={false}
      />
    );

    const trigger = screen.getByRole('button', { name: /Seleccionar rango de período/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /Calendario de rango mensual/i })).toBeInTheDocument();

    // Cambiar año a 2020 y elegir Agosto -> luego Marzo (debe ordenar 2020-03 a 2020-08)
    const yearSelect = screen.getByRole('combobox', { name: /Año/i });
    fireEvent.change(yearSelect, { target: { value: '2020' } });

    fireEvent.click(screen.getByRole('button', { name: 'Ago 2020' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mar 2020' }));

    expect(onChangePeriodo).toHaveBeenCalledWith({ desde: '2020-03', hasta: '2020-08' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes popover with Escape key', () => {
    render(
      <PeriodRangePicker
        periodo={{ desde: '2000-11', hasta: '2026-11' }}
        onChangePeriodo={vi.fn()}
        mesMin="2000-11"
        mesMax="2026-11"
        isEn={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Select period range/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
