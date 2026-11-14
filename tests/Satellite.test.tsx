import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SATELLITES, SATELLITE_LIST } from '../src/data/satellites';
import { SatelliteSelector } from '../src/features/satellite/SatelliteSelector';
import { SatelliteInfo } from '../src/features/satellite/SatelliteInfo';

describe('Satellite 3D Features & Data', () => {
  it('contains complete metadata for Terra, Aqua and Suomi NPP', () => {
    expect(SATELLITE_LIST).toHaveLength(3);

    expect(SATELLITES.terra.instrument).toBe('MODIS');
    expect(SATELLITES.terra.modelPath).toBe('/models/terra.glb');

    expect(SATELLITES.aqua.instrument).toBe('MODIS');
    expect(SATELLITES.aqua.modelPath).toBe('/models/aqua.glb');

    expect(SATELLITES.suomi.instrument).toBe('VIIRS');
    expect(SATELLITES.suomi.modelPath).toBe('/models/suomi.glb');
  });

  it('renders SatelliteSelector and triggers onSelect callback', () => {
    const handleSelect = vi.fn();
    render(<SatelliteSelector selectedId="terra" onSelect={handleSelect} />);

    expect(screen.getByRole('radio', { name: /Terra/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Aqua/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Suomi NPP/i })).toBeInTheDocument();

    const aquaButton = screen.getByRole('radio', { name: /Aqua/i });
    fireEvent.click(aquaButton);

    expect(handleSelect).toHaveBeenCalledWith('aqua');
  });

  it('renders SatelliteInfo with detailed instrument role and specifications', () => {
    render(<SatelliteInfo satellite={SATELLITES.suomi} />);

    expect(screen.getByText('Suomi National Polar-orbiting Partnership')).toBeInTheDocument();
    expect(screen.getAllByText('VIIRS')[0]).toBeInTheDocument();
    expect(screen.getByText(/375 m de resolución espacial/i)).toBeInTheDocument();
    expect(screen.getAllByText(/NASA \/ NOAA/i)[0]).toBeInTheDocument();
  });
});
