import React, { useEffect } from 'react';
import { SatelliteViewer } from './SatelliteViewer';
import { X, Orbit } from 'lucide-react';

interface SatelliteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SatelliteModal: React.FC<SatelliteModalProps> = ({ isOpen, onClose }) => {
  // Cerrar al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevenir scroll de fondo mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="satellite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-6xl max-h-[94vh] rounded-2xl bg-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Orbit className="h-5 w-5" />
            </div>
            <div>
              <h2 id="satellite-modal-title" className="text-sm font-bold tracking-tight">
                Flota Satelital NASA (MODIS & VIIRS)
              </h2>
              <p className="text-[11px] text-slate-400">
                Observación tridimensional de los instrumentos utilizados en el monitoreo de focos de calor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor 3D"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visor 3D */}
        <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-slate-950">
          <SatelliteViewer />
        </div>
      </div>
    </div>
  );
};
