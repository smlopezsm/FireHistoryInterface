import React, { useState, Suspense } from 'react';
import { MainLayout } from './layout/MainLayout';
import { Footer } from './layout/Footer';
import { MethodDialog } from './MethodDialog';

// Carga diferida (code-splitting) del visor 3D para mantener el bundle inicial ultraliviano
const SatelliteModal = React.lazy(() =>
  import('../features/satellite').then((module) => ({
    default: module.SatelliteModal,
  }))
);

export const App: React.FC = () => {
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isSatellitesOpen, setIsSatellitesOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#07100F] text-[#EFF5ED] selection:bg-[#B8EE68] selection:text-[#07100F]">
      <MainLayout
        metodoAbierto={isMethodOpen}
        onOpenMethod={() => setIsMethodOpen(true)}
        onOpenSatellites={() => setIsSatellitesOpen(true)}
      />
      <Footer />

      {/* Visor 3D de Satélites NASA (Terra, Aqua, Suomi NPP) con carga diferida */}
      {isSatellitesOpen && (
        <Suspense fallback={null}>
          <SatelliteModal
            isOpen={isSatellitesOpen}
            onClose={() => setIsSatellitesOpen(false)}
          />
        </Suspense>
      )}

      {/* Modal explicativo del Método de Armonización (docs/02 MethodDialog) */}
      <MethodDialog
        isOpen={isMethodOpen}
        onClose={() => setIsMethodOpen(false)}
      />
    </div>
  );
};
