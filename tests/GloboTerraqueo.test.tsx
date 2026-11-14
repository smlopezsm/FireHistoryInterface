import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GloboTerraqueo } from '../src/features/globe/GloboTerraqueo';

// Mock mapbox-gl para entorno jsdom
vi.mock('mapbox-gl', () => {
  return {
    default: {
      accessToken: '',
      Map: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        remove: vi.fn(),
        setFog: vi.fn(),
        getZoom: vi.fn().mockReturnValue(2),
        getCenter: vi.fn().mockReturnValue({ lng: -64, lat: -36 }),
        easeTo: vi.fn(),
        flyTo: vi.fn(),
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
      })),
    },
  };
});

describe('GloboTerraqueo 3D Component', () => {
  it('renders 3D globe header with title and badges', () => {
    render(<GloboTerraqueo />);

    expect(screen.getAllByText('Globo Terráqueo 3D')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Mapbox Satellite/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/rotación automática/i)[0]).toBeInTheDocument();
    expect(screen.getAllByTitle(/Centrar en Argentina/i)[0]).toBeInTheDocument();
  });

  it('renders token configuration prompt when token is not present in environment', () => {
    render(<GloboTerraqueo />);

    expect(screen.getByText('Token de Mapbox GL JS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('pk.eyJ1Ijoi...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inicializar Globo 3D/i })).toBeInTheDocument();
  });

  it('allows user to toggle auto-rotation button', () => {
    render(<GloboTerraqueo />);

    const rotateBtn = screen.getByTitle(/Pausar rotación automática/i);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(rotateBtn);
    expect(rotateBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
