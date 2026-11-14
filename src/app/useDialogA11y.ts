import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Hook para gestión accesible de modales conforme a WAI-ARIA 1.2:
 * - Foco inicial en elemento específico o primer elemento interactivo
 * - Contención de foco (Tab / Shift+Tab)
 * - Cierre accesible con tecla Escape
 * - Bloqueo de scroll en documento
 * - Restauración garantizada del foco al elemento que abrió el diálogo
 */
export function useDialogA11y({
  isOpen,
  onClose,
  initialFocusRef,
}: UseDialogA11yOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Almacenar el elemento que tenía el foco antes de abrir
    triggerElementRef.current = (document.activeElement as HTMLElement) || null;

    // Prevenir scroll de fondo mientras el modal está activo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial
    const timer = window.setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          containerRef.current.focus();
        }
      }
    }, 15);

    // Gestor de teclado para Escape y contención de foco (Tab / Shift+Tab)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableList = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => {
          // Filtrar elementos visibles
          return el.offsetParent !== null || el.getAttribute('tabindex') !== '-1';
        });

        if (focusableList.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableList[0];
        const lastElement = focusableList[focusableList.length - 1];

        if (e.shiftKey) {
          // Shift + Tab hacia atrás
          if (document.activeElement === firstElement || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab hacia adelante
          if (document.activeElement === lastElement || !containerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      // Restaurar foco al elemento disparador
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  return { containerRef };
}
