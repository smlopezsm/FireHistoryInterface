import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Providers } from '../src/app/providers';
import { BackendHealthIndicator } from '../src/app/layout/BackendHealthIndicator';

describe('BackendHealthIndicator Component', () => {
  it('renders backend health badge in header', () => {
    render(
      <Providers>
        <BackendHealthIndicator />
      </Providers>
    );

    const button = screen.getByRole('button', { name: /Backend status|Estado del backend/i });
    expect(button).toBeInTheDocument();
  });

  it('displays tooltip with backend info when hovered', async () => {
    render(
      <Providers>
        <BackendHealthIndicator />
      </Providers>
    );

    const container = screen.getByRole('button', { name: /Backend status|Estado del backend/i }).parentElement;
    expect(container).toBeInTheDocument();

    if (container) {
      fireEvent.mouseEnter(container);
    }

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText(/Base URL:/i)).toBeInTheDocument();
    expect(screen.getByText(/FireHistoryInterfaceAPI/i)).toBeInTheDocument();
  });
});
