import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../src/i18n';
import { Providers } from '../src/app/providers';
import { App } from '../src/app/App';

describe('App Shell Layout & i18n (User Story 1)', () => {
  beforeEach(() => {
    i18n.changeLanguage('es');
  });

  it('renders header, main layout and footer', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    // Header title
    expect(screen.getByRole('heading', { name: /FuegoContinuo/i })).toBeInTheDocument();

    // Check key widgets in main layout
    expect(screen.getAllByText(/Selección de Área/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Globo Terráqueo 3D/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Anomalía/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Calendario Armonizado mes × año/i)[0]).toBeInTheDocument();

    // Footer sources
    expect(screen.getByText(/NASA FIRMS/i)).toBeInTheDocument();
  });

  it('toggles language between Spanish and English when clicking language button', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    const langButton = screen.getByRole('button', { name: /Idioma: ES/i });
    expect(langButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /¿Cómo se calcula\?/i })).toBeInTheDocument();

    // Switch to English
    fireEvent.click(langButton);
    expect(screen.getByRole('button', { name: /How is it calculated\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Language: EN/i })).toBeInTheDocument();

    // Switch back to Spanish
    fireEvent.click(langButton);
    expect(screen.getByRole('button', { name: /¿Cómo se calcula\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Idioma: ES/i })).toBeInTheDocument();
  });

  it('opens and closes method dialog', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    const methodButton = screen.getByRole('button', { name: /¿Cómo se calcula\?/i });
    fireEvent.click(methodButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Armonización MODIS y VIIRS/i)).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Entendido/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
