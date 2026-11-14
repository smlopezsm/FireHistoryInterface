import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SatelliteViewer } from './SatelliteViewer';
import { X, Orbit } from 'lucide-react';
import { useDialogA11y } from '../../app/useDialogA11y';

interface SatelliteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SatelliteModal: React.FC<SatelliteModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const { containerRef } = useDialogA11y({
    isOpen,
    onClose,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="satellite-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-6xl max-h-[94vh] rounded-xl bg-[#0D1816] border border-[#21312D] shadow-[0_12px_32px_rgba(0,0,0,0.65)] overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#21312D] bg-[#111E1B] text-[#EFF5ED]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#21312D] bg-[#07100F] text-[#B8EE68]">
              <Orbit className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="satellite-modal-title" className="text-sm font-sans font-bold tracking-tight text-[#EFF5ED]">
                {t('satelliteModal.title')}
              </h2>
              <p className="text-xs text-[#93A39C] font-sans">
                {t('satelliteModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('satelliteModal.close')}
            className="rounded-md p-1.5 text-[#93A39C] transition-colors hover:bg-[#07100F] hover:text-[#EFF5ED] focus:outline-none focus:ring-2 focus:ring-[#B8EE68]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Visor 3D */}
        <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-[#07100F]">
          <SatelliteViewer />
        </div>
      </div>
    </div>
  );
};
