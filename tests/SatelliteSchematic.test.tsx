import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../src/i18n';
import { SatelliteSchematic } from '../src/features/satellite-schematic';

describe('SatelliteSchematic Component (English Default)', () => {
  it('renders schematic title, telemetry indicators and subsystems', () => {
    render(<SatelliteSchematic />);

    expect(
      screen.getByRole('heading', {
        name: /Instrument & Spacecraft Platform Anatomy|Anatomía del Instrumento y Plataforma Satelital/i,
      })
    ).toBeInTheDocument();

    // Microdatos de telemetría orbital
    expect(screen.getByText(/Orbital Altitude|Altitud Orbital/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass Time|Hora de Paso/i)).toBeInTheDocument();
    expect(screen.getByText(/Swath Width|Ancho de Barrido/i)).toBeInTheDocument();
    expect(screen.getByText(/Detection Resolution|Resolución de Detección/i)).toBeInTheDocument();

    // Subsistemas clave
    expect(screen.getByText(/Payload \(Optical Sensor\)|Carga Útil/i)).toBeInTheDocument();
    expect(screen.getByText(/Solar Power|Generación Solar/i)).toBeInTheDocument();
    expect(screen.getByText(/Thermal Control|Control Térmico/i)).toBeInTheDocument();
    expect(screen.getByText(/Communications|Comunicaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/Attitude & Navigation|Actitud y Navegación/i)).toBeInTheDocument();
    expect(screen.getByText(/Orbital Propulsion|Propulsión Orbital/i)).toBeInTheDocument();
  });

  it('toggles between MODIS and VIIRS instrument modes', () => {
    render(<SatelliteSchematic />);

    const viirsBtn = screen.getByRole('radio', { name: /VIIRS · Suomi-NPP/i });
    const modisBtn = screen.getByRole('radio', { name: /MODIS · Terra \/ Aqua/i });

    expect(modisBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('705 km')).toBeInTheDocument();

    // Switch to VIIRS
    fireEvent.click(viirsBtn);
    expect(viirsBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('824 km')).toBeInTheDocument();

    // Switch back to MODIS
    fireEvent.click(modisBtn);
    expect(modisBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('705 km')).toBeInTheDocument();
  });

  it('toggles exploded view state', () => {
    render(<SatelliteSchematic />);

    const explodeBtn = screen.getByRole('button', {
      name: /Disassemble Subsystems|Desarmar Subsistemas/i,
    });
    expect(explodeBtn).toBeInTheDocument();

    fireEvent.click(explodeBtn);
    expect(
      screen.getByRole('button', { name: /Assemble Spacecraft|Rearmar Nave/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Assemble Spacecraft|Rearmar Nave/i })
    );
    expect(
      screen.getByRole('button', { name: /Disassemble Subsystems|Desarmar Subsistemas/i })
    ).toBeInTheDocument();
  });

  it('triggers onOpen3D callback when clicking 3D inspect button', () => {
    const handleOpen3D = vi.fn();
    render(<SatelliteSchematic onOpen3D={handleOpen3D} />);

    const inspectBtn = screen.getByRole('button', {
      name: /Inspect 3D NASA|Inspeccionar 3D NASA/i,
    });
    expect(inspectBtn).toBeInTheDocument();

    fireEvent.click(inspectBtn);
    expect(handleOpen3D).toHaveBeenCalledTimes(1);
  });
});
