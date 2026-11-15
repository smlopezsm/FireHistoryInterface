import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '../src/i18n';
import { Providers } from '../src/app/providers';
import * as api from '../src/api/client';
import { GloboTerraqueo } from '../src/features/globe/GloboTerraqueo';

vi.mock('maplibre-gl', () => {
  const Map = vi.fn().mockImplementation(() => {
    const handlers: Record<string, ((e?: any) => void)[]> = {};
    const sources = new globalThis.Map<string, any>();
    const layers = new globalThis.Map<string, any>();
    const canvas = { style: { cursor: '' } };

    return {
      on: vi.fn((event: string, layerOrCb: any, maybeCb?: any) => {
        const cb = typeof layerOrCb === 'function' ? layerOrCb : maybeCb;
        if (typeof cb !== 'function') return;
        handlers[event] = handlers[event] || [];
        handlers[event].push(cb);
        if (event === 'style.load') Promise.resolve().then(() => cb());
      }),
      off: vi.fn(),
      remove: vi.fn(),
      setProjection: vi.fn(),
      getCanvas: vi.fn(() => canvas),
      getSource: vi.fn((id: string) => sources.get(id)),
      addSource: vi.fn((id: string, spec: any) => {
        sources.set(id, { ...spec, setData: vi.fn() });
      }),
      getLayer: vi.fn((id: string) => layers.get(id)),
      addLayer: vi.fn((spec: any) => {
        layers.set(spec.id, spec);
      }),
      setLayoutProperty: vi.fn(),
      setFeatureState: vi.fn(),
      doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
      queryRenderedFeatures: vi.fn(() => []),
      querySourceFeatures: vi.fn(() => []),
      getZoom: vi.fn().mockReturnValue(3.5),
      getCenter: vi.fn().mockReturnValue({ lng: -64, lat: -36 }),
      getBounds: vi.fn().mockReturnValue({
        getWest: () => -73.6,
        getSouth: () => -55.1,
        getEast: () => -53.6,
        getNorth: () => -21.8,
      }),
      easeTo: vi.fn(),
      flyTo: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    };
  });
  const Popup = vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  }));
  return { Map, Popup, default: { Map, Popup } };
});

describe('GloboTerraqueo Component', () => {
  const renderGlobe = () =>
    render(
      <Providers>
        <GloboTerraqueo />
      </Providers>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'getMapaCeldas').mockResolvedValue({
      type: 'FeatureCollection',
      features: [],
    });
  });

  it('renders 3D globe header with title and MapLibre badge', () => {
    renderGlobe();

    expect(screen.getAllByText(/3D Earth Globe|Globo Terráqueo 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/MapLibre 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/Recenter on Argentina|Centrar en Argentina/i)[0]).toBeInTheDocument();
  });

  it('initializes MapLibre without requiring an access token', async () => {
    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    expect(screen.queryByPlaceholderText('pk.eyJ1Ijoi...')).not.toBeInTheDocument();
    expect(maplibregl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        cooperativeGestures: true,
      })
    );
  });

  it('registers celdas, industriales, zona, dibujo and provincias-source on style.load', async () => {
    const maplibregl = await import('maplibre-gl');
    renderGlobe();

    const mapInstance = (maplibregl.Map as unknown as ReturnType<typeof vi.fn>).mock.results[0]
      .value;

    await waitFor(() => {
      expect(mapInstance.addSource).toHaveBeenCalledWith(
        'provincias-source',
        expect.objectContaining({ type: 'geojson', generateId: true })
      );
      expect(mapInstance.addSource).toHaveBeenCalledWith('celdas', expect.any(Object));
      expect(mapInstance.addSource).toHaveBeenCalledWith('industriales', expect.any(Object));
      expect(mapInstance.addSource).toHaveBeenCalledWith('zona', expect.any(Object));
      expect(mapInstance.addSource).toHaveBeenCalledWith('dibujo', expect.any(Object));
    });
  });

  it('allows user to toggle auto-rotation button', () => {
    renderGlobe();

    const spinBtn = screen.getByRole('button', { name: /Pause|Pausar|Spin|Rotar/i });
    const initialPressed = spinBtn.getAttribute('aria-pressed');
    fireEvent.click(spinBtn);
    expect(spinBtn.getAttribute('aria-pressed')).not.toBe(initialPressed);
  });
});
