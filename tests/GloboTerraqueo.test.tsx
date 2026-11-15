import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { GloboTerraqueo } from '../src/features/globe/GloboTerraqueo';

// Mock maplibre-gl para entorno jsdom
vi.mock('maplibre-gl', () => {
  const Map = vi.fn().mockImplementation(() => ({
    on: vi.fn((event: string, cb: () => void) => {
      if (event === 'style.load') Promise.resolve().then(cb);
    }),
    remove: vi.fn(),
    setProjection: vi.fn(),
    setStyle: vi.fn(),
    stop: vi.fn(),
    getBearing: vi.fn().mockReturnValue(0),
    getZoom: vi.fn().mockReturnValue(3.5),
    getCenter: vi.fn().mockReturnValue({ lng: -64, lat: -36 }),
    easeTo: vi.fn(),
    flyTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }));
  const Marker = vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }));
  const Popup = vi.fn().mockImplementation(() => ({
    setHTML: vi.fn().mockReturnThis(),
  }));
  return { Map, Marker, Popup, default: { Map, Marker, Popup } };
});

describe('GloboTerraqueo 3D Component', () => {
  const renderGlobe = () =>
    render(
      <Providers>
        <GloboTerraqueo />
      </Providers>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getMetadata').mockResolvedValue({
      schema_version: '1.1.0',
      data_version: '2026-11-14T17:49:45-03:00',
      factores_version: '2026.11-b1',
      fecha_min: '2000-11-01',
      fecha_max: '2026-11-13',
      fecha_ultimo_sp: '2026-08-31',
      fuentes: ['MODIS', 'VIIRS'],
      referencia_viirs: [{ satelite: 'SNPP', desde: '2012-01-20', hasta: null }],
      celdas_total: 112711,
      provincias_total: 24,
    });
    vi.spyOn(api, 'getMapaCeldas').mockResolvedValue({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('renders 3D globe header with title and MapLibre badge', () => {
    renderGlobe();

    expect(screen.getAllByText(/3D Earth Globe|Globo Terráqueo 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/MapLibre 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/auto-rotation|rotación automática/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/Recenter on Argentina|Centrar en Argentina/i)[0]).toBeInTheDocument();
  });

  it('initializes MapLibre 3D globe immediately without requiring an access token', async () => {
    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    expect(screen.queryByPlaceholderText('pk.eyJ1Ijoi...')).not.toBeInTheDocument();
    expect(maplibregl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        cooperativeGestures: true,
      })
    );
  });

  it('queries latest month from metadata and navigates to previous historical month', async () => {
    renderGlobe();

    await waitFor(() => {
      expect(api.getMapaCeldas).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: '2026-11-01',
          hasta: '2026-11-13',
        })
      );
    });

    const prevBtn = screen.getByRole('button', { name: /Previous month|Mes anterior/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(api.getMapaCeldas).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: '2026-10-01',
          hasta: '2026-10-31',
        })
      );
    });
  });

  it('allows user to toggle auto-rotation button and stops map animation when paused', async () => {
    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    const rotateBtn = screen.getByTitle(/Pause auto-rotation|Pausar rotación automática/i);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(rotateBtn);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');

    const mapInstance = vi.mocked(maplibregl.Map).mock.results.at(-1)?.value;
    expect(mapInstance.stop).toHaveBeenCalled();
  });

  it('toggles between IGN dark 3D map and Esri satellite view', async () => {
    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    const styleBtn = screen.getByTitle(/Switch to satellite|Cambiar a vista satelital/i);
    expect(styleBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(styleBtn);
    expect(styleBtn).toHaveAttribute('aria-pressed', 'true');

    const mapInstance = vi.mocked(maplibregl.Map).mock.results.at(-1)?.value;
    expect(mapInstance.setStyle).toHaveBeenCalledWith(
      expect.objectContaining({
        projection: { type: 'globe' },
      })
    );
  });

  it('includes clickable Google Maps coordinates link in hotspot popup HTML', async () => {
    vi.spyOn(api, 'getMapaCeldas').mockResolvedValue({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[-64.42, -31.35], [-64.42, -31.35], [-64.42, -31.35], [-64.42, -31.35]]],
          },
          properties: { cell_id: 1, valor: 25, viirs: 25, provincia_id: 6 },
        },
      ],
    } as any);

    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    await waitFor(() => {
      expect(vi.mocked(maplibregl.Popup)).toHaveBeenCalled();
    });

    const firstPopup = vi.mocked(maplibregl.Popup).mock.results[0]?.value;
    const htmlArg = vi.mocked(firstPopup.setHTML).mock.calls[0]?.[0] as string;
    expect(htmlArg).toContain('https://www.google.com/maps?q=-31.3500,-64.4200');
    expect(htmlArg).toContain('Google Maps');
  });

  it('scrubs timeline via horizontal range slider without collapsing readout', async () => {
    renderGlobe();

    await waitFor(() => {
      expect(api.getMapaCeldas).toHaveBeenCalledTimes(1);
    });

    const slider = screen.getByLabelText(/Timeline slider|Deslizador temporal/i);
    fireEvent.change(slider, { target: { value: '0' } });

    await waitFor(() => {
      expect(api.getMapaCeldas).toHaveBeenCalledWith(
        expect.objectContaining({
          desde: '2000-11-01',
          hasta: '2000-11-30',
        })
      );
    });
  });

  it('respects prefers-reduced-motion and initializes auto-rotation paused', () => {
    const originalMatchMedia = window.matchMedia;
    try {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderGlobe();
      const rotateBtn = screen.getByTitle(/Start auto-rotation|Resume auto-rotation|Reanudar rotación/i);
      expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('ensures control buttons meet minimum touch target size classes', () => {
    renderGlobe();

    const rotateBtn = screen.getByTitle(/auto-rotation|rotación automática/i);
    const recenterBtn = screen.getByTitle(/Recenter on Argentina|Centrar en Argentina/i);
    const fullscreenBtn = screen.getByTitle(/Fullscreen|Pantalla completa/i);

    expect(rotateBtn.className).toContain('min-h-[36px]');
    expect(recenterBtn.className).toContain('min-h-[36px]');
    expect(fullscreenBtn.className).toContain('min-h-[36px]');
  });
});
