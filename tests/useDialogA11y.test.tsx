import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useRef } from 'react';
import { useDialogA11y } from '../src/app/useDialogA11y';

const TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const { containerRef } = useDialogA11y({
    isOpen,
    onClose,
    initialFocusRef: firstButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      <button ref={firstButtonRef} type="button">First</button>
      <button type="button">Middle</button>
      <button type="button">Last</button>
    </div>
  );
};

describe('useDialogA11y Focus Trap & Restoration Hook', () => {
  it('locks body scroll when open and restores it when unmounted', () => {
    const handleClose = vi.fn();
    const { unmount } = render(<TestModal isOpen={true} onClose={handleClose} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab navigation within container', () => {
    const handleClose = vi.fn();
    render(<TestModal isOpen={true} onClose={handleClose} />);

    const firstBtn = screen.getByRole('button', { name: 'First' });
    const middleBtn = screen.getByRole('button', { name: 'Middle' });
    const lastBtn = screen.getByRole('button', { name: 'Last' });

    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);

    // Tab forwards
    middleBtn.focus();
    expect(document.activeElement).toBe(middleBtn);

    lastBtn.focus();
    expect(document.activeElement).toBe(lastBtn);

    // Pressing Tab on last button wraps to first button
    fireEvent.keyDown(window, { key: 'Tab', code: 'Tab' });
    expect(document.activeElement).toBe(firstBtn);

    // Pressing Shift+Tab on first button wraps to last button
    fireEvent.keyDown(window, { key: 'Tab', code: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastBtn);
  });

  it('triggers onClose when pressing Escape', () => {
    const handleClose = vi.fn();
    render(<TestModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
