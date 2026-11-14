import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SatelliteSchematic } from '../src/features/satellite-schematic';

describe('SatelliteSchematic Component', () => {
  it('renders schematic title, telemetry indicators and subsystems', () => {
    render(<SatelliteSchematic />);

    expect(
      screen.getByRole('heading', { name: /Anatomía del Instrumento y Plataforma Satelital/i })
    ).toBeInTheDocument();

    // Microdatos de telemetría orbital
    expect(screen.getByText(/Altitud Orbital/i)).toBeInTheDocument();
    expect(screen.getByText(/Hora de Paso/i)).toBeInTheDocument();
    expect(screen.getByText(/Ancho de Barrido/i)).toBeInTheDocument();
    expect(screen.getByText(/Resolución de Detección/i)).toBeInTheDocument();

    // Subsistemas clave
    expect(screen.getByText(/Carga Útil \(Sensor Óptico\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Generación Solar y Baterías/i)).toBeInTheDocument();
    expect(screen.getByText(/Control Térmico \(MLI & Radiador\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Comunicaciones y Telemetría/i)).toBeInTheDocument();
    expect(screen.getByText(/Actitud y Navegación \(AOCS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Propulsión Orbital/i)).toBeInTheDocument();
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

    const explodeBtn = screen.getByRole('button', { name: /Desarmar Subsistemas/i });
    expect(explodeBtn).toBeInTheDocument();

    fireEvent.click(explodeBtn);
    expect(screen.getByRole('button', { name: /Rearmar Nave/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Rearmar Nave/i }));
    expect(screen.getByRole('button', { name: /Desarmar Subsistemas/i })).toBeInTheDocument();
  });

  it('triggers onOpen3D callback when clicking 3D inspect button', () => {
    const handleOpen3D = vi.fn();
    render(<SatelliteSchematic onOpen3D={handleOpen3D} />);

    const inspectBtn = screen.getByRole('button', { name: /Inspeccionar 3D NASA/i });
    expect(inspectBtn).toBeInTheDocument();

    fireEvent.click(inspectBtn);
    expect(handleOpen3D).toHaveBeenCalledTimes(1);
  });
});
