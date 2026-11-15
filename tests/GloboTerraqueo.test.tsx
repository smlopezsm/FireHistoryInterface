import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../src/i18n';
import { GloboTerraqueo } from '../src/features/globe/GloboTerraqueo';

// Mock maplibre-gl para entorno jsdom
vi.mock('maplibre-gl', () => {
  const Map = vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    remove: vi.fn(),
    setProjection: vi.fn(),
    getZoom: vi.fn().mockReturnValue(2),
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
  it('renders 3D globe header with title and MapLibre badge', () => {
    render(<GloboTerraqueo />);

    expect(screen.getAllByText(/3D Earth Globe|Globo Terráqueo 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/MapLibre 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/auto-rotation|rotación automática/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/Recenter on Argentina|Centrar en Argentina/i)[0]).toBeInTheDocument();
  });

  it('initializes MapLibre 3D globe immediately without requiring an access token', async () => {
    const maplibregl = await import('maplibre-gl');
    render(<GloboTerraqueo />);

    expect(screen.queryByPlaceholderText('pk.eyJ1Ijoi...')).not.toBeInTheDocument();
    expect(maplibregl.Map).toHaveBeenCalledWith(
      expect.objectContaining({
        cooperativeGestures: true,
      })
    );
  });

  it('allows user to toggle auto-rotation button', () => {
    render(<GloboTerraqueo />);

    const rotateBtn = screen.getByTitle(/Pause auto-rotation|Pausar rotación automática/i);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(rotateBtn);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');
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

      render(<GloboTerraqueo />);
      const rotateBtn = screen.getByTitle(/Start auto-rotation|Resume auto-rotation|Reanudar rotación/i);
      expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('ensures control buttons meet minimum touch target size classes', () => {
    render(<GloboTerraqueo />);

    const rotateBtn = screen.getByTitle(/auto-rotation|rotación automática/i);
    const recenterBtn = screen.getByTitle(/Recenter on Argentina|Centrar en Argentina/i);
    const fullscreenBtn = screen.getByTitle(/Fullscreen|Pantalla completa/i);

    expect(rotateBtn.className).toContain('min-h-[36px]');
    expect(recenterBtn.className).toContain('min-h-[36px]');
    expect(fullscreenBtn.className).toContain('min-h-[36px]');
  });
});
