import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import i18n from '../src/i18n';
import { Providers } from '../src/app/providers';
import { App } from '../src/app/App';

describe('App Shell Layout & i18n (English Default)', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('renders header, main layout and footer in English by default', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    // Header title
    expect(screen.getByRole('heading', { name: /FuegoContinuo/i })).toBeInTheDocument();

    // Check key widgets in main layout in English
    expect(screen.getAllByText(/Area Selection/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/3D Earth Globe/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Monthly Anomaly/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Harmonized Calendar month × year/i)[0]).toBeInTheDocument();

    // Footer sources
    expect(screen.getByText(/NASA FIRMS/i)).toBeInTheDocument();
  });

  it('toggles language between English and Spanish when clicking language button', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    // Starts in English by default
    const langButton = screen.getByRole('button', { name: /Language: EN/i });
    expect(langButton).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How is it calculated\?/i })).toBeInTheDocument();

    // Switch to Spanish
    fireEvent.click(langButton);
    expect(screen.getByRole('button', { name: /¿Cómo se calcula\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Idioma: ES/i })).toBeInTheDocument();

    // Switch back to English
    fireEvent.click(langButton);
    expect(screen.getByRole('button', { name: /How is it calculated\?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Language: EN/i })).toBeInTheDocument();
  });

  it('opens and closes method dialog in English', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    const methodButton = screen.getByRole('button', { name: /How is it calculated\?/i });
    fireEvent.click(methodButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText(/MODIS and VIIRS/i)[0]).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Understood/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes method dialog with Escape key and restores focus to trigger button', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    const methodButton = screen.getByRole('button', { name: /How is it calculated\?/i });
    methodButton.focus();
    expect(document.activeElement).toBe(methodButton);

    fireEvent.click(methodButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Presionar Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(methodButton);
  });

  it('contains focus within method dialog when pressing Tab', () => {
    render(
      <Providers>
        <App />
      </Providers>
    );

    const methodButton = screen.getByRole('button', { name: /How is it calculated\?/i });
    fireEvent.click(methodButton);

    const dialog = screen.getByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    const topCloseBtn = buttons[0];
    const understandBtn = buttons[1];

    // Focus starts at initial close button
    topCloseBtn.focus();
    expect(document.activeElement).toBe(topCloseBtn);

    // Tab moves to bottom button
    fireEvent.keyDown(window, { key: 'Tab' });
    understandBtn.focus();

    // Tab on last element wraps back to first element
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Escape closes dialog
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
