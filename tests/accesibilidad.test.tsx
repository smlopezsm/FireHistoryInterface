import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import i18n, { idiomaInicial } from '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { CalendarHeatmapWidget } from '../src/features/dashboard/CalendarHeatmapWidget';

const punto = (periodo: string, armonizado: number) => ({
  periodo,
  armonizado,
  modis: 1,
  viirs: armonizado,
  minimo: armonizado,
  maximo: armonizado,
  estado: 'observado',
  frac_estimada: 0,
  confianza: 'alta',
  parcial: false,
});

// Dos años completos: 2024 arriba (más reciente) y 2023 abajo.
const meses = [2023, 2024].flatMap((anio) =>
  Array.from({ length: 12 }, (_, i) => punto(`${anio}-${String(i + 1).padStart(2, '0')}`, 100 + i)),
);

const renderizar = () =>
  render(
    <Providers>
      <CalendarHeatmapWidget zonaNombre="San Luis" capa="armonizado" pedido={{ provincia_id: '74' }} />
    </Providers>,
  );

const celda = (nombre: RegExp) => screen.getByRole('gridcell', { name: nombre });

describe('Calendario con teclado', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getCalendario').mockResolvedValue({
      zona: { tipo: 'provincia', id: '74' },
      unidad: 'focos (escala VIIRS S-NPP)',
      meses,
      resumen: { total: 1, max_mes: '2024-12', max_anio: 2024, mediana_mensual: 1 },
    } as any);
  });

  it('la matriz tiene una sola parada de Tab', async () => {
    renderizar();
    await screen.findAllByRole('gridcell');
    const tabulables = screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0);
    expect(tabulables).toHaveLength(1);
  });

  it('las flechas, Inicio y Fin mueven el foco entre meses', async () => {
    renderizar();
    await screen.findAllByRole('gridcell');
    const inicio = screen.getAllByRole('gridcell').find((c) => c.tabIndex === 0)!;
    inicio.focus();
    expect(inicio).toHaveAccessibleName(/(Ene|Jan) 2024/);

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(celda(/Feb 2024/));

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(celda(/Feb 2023/));

    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(celda(/(Dic|Dec) 2023/));

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(celda(/(Dic|Dec) 2024/));

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(celda(/(Ene|Jan) 2024/));

    // La celda con foco pasa a ser la única tabulable.
    expect(screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0)).toEqual([document.activeElement]);
  });

  it('en el borde, la flecha no saca el foco de la matriz', async () => {
    renderizar();
    await screen.findAllByRole('gridcell');
    celda(/(Ene|Jan) 2024/).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(celda(/(Ene|Jan) 2024/));
  });

  it('axe no encuentra violaciones serias o críticas', async () => {
    const { container } = renderizar();
    await screen.findAllByRole('gridcell');
    const resultado = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    const graves = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

describe('Idioma', () => {
  it('usa ?lang si viene en la URL', () => {
    expect(idiomaInicial('?lang=en', ['es-AR'])).toBe('en');
    expect(idiomaInicial('?lang=es', ['en-US'])).toBe('es');
  });

  it('si no, toma el idioma del navegador y por defecto español', () => {
    expect(idiomaInicial('', ['es-419', 'en'])).toBe('es');
    expect(idiomaInicial('', ['en-US'])).toBe('en');
    expect(idiomaInicial('', ['fr-FR'])).toBe('es');
    expect(idiomaInicial('', [])).toBe('es');
  });

  it('el atributo lang del documento sigue al idioma activo', async () => {
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
