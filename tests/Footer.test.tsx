import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Providers } from '../src/app/providers';
import { Footer } from '../src/app/layout/Footer';

describe('Footer Component & Metadata (User Story 2)', () => {
  it('renders attribution sources for NASA FIRMS and IGN', () => {
    render(
      <Providers>
        <Footer />
      </Providers>
    );

    expect(screen.getByText(/NASA FIRMS/i)).toBeInTheDocument();
    expect(
      screen.getByText(/National Geographic Institute|Instituto Geográfico Nacional/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Data version:|Versión de datos:/i)).toBeInTheDocument();
  });

  it('renders method notice regarding pre-2012 estimated data', () => {
    render(
      <Providers>
        <Footer />
      </Providers>
    );

    expect(
      screen.getByText(
        /Prior to 2012, data originates from MODIS|Antes de 2012 los datos provienen del satélite MODIS/i
      )
    ).toBeInTheDocument();
  });
});
