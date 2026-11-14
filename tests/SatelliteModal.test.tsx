import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../src/i18n';
import { SatelliteModal } from '../src/features/satellite/SatelliteModal';

vi.mock('../src/features/satellite/SatelliteViewer', () => ({
  SatelliteViewer: () => <div data-testid="mock-viewer">3D Satellite Mock</div>,
}));

describe('SatelliteModal A11y & Focus Management', () => {
  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(<SatelliteModal isOpen={false} onClose={handleClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal with correct ARIA attributes when isOpen is true', () => {
    const handleClose = vi.fn();
    render(<SatelliteModal isOpen={true} onClose={handleClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'satellite-modal-title');
    expect(screen.getByTestId('mock-viewer')).toBeInTheDocument();
  });

  it('closes modal when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(<SatelliteModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when clicking on the backdrop outside the card', () => {
    const handleClose = vi.fn();
    render(<SatelliteModal isOpen={true} onClose={handleClose} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('restores focus to opener button upon unmount', () => {
    const trigger = document.createElement('button');
    trigger.setAttribute('id', 'test-trigger-btn');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const handleClose = vi.fn();
    const { unmount } = render(<SatelliteModal isOpen={true} onClose={handleClose} />);

    // Unmount modal (simulating close)
    unmount();

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });
});
