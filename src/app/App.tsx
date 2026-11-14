import React, { useState, Suspense } from 'react';
import { Header } from './layout/Header';
import { MainLayout } from './layout/MainLayout';
import { Footer } from './layout/Footer';
import { HelpCircle, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Carga diferida (code-splitting) del visor 3D para mantener el bundle inicial ultraliviano
const SatelliteModal = React.lazy(() =>
  import('../features/satellite').then((module) => ({
    default: module.SatelliteModal,
  }))
);

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [isMethodOpen, setIsMethodOpen] = useState(false);
  const [isSatellitesOpen, setIsSatellitesOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#07100F] text-[#EFF5ED] selection:bg-[#B8EE68] selection:text-[#07100F]">
      <Header
        onOpenMethod={() => setIsMethodOpen(true)}
        onOpenSatellites={() => setIsSatellitesOpen(true)}
      />
      <MainLayout
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
      {isMethodOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="method-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#21312D] bg-[#0D1816] p-6 shadow-2xl text-[#EFF5ED]">
            <div className="flex items-center justify-between border-b border-[#21312D] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#B8EE68]" />
                <h2
                  id="method-dialog-title"
                  className="font-title text-base font-bold text-[#EFF5ED]"
                >
                  {t('header.methodLink')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodOpen(false)}
                className="rounded-lg p-1 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] focus:outline-none focus:ring-2 focus:ring-[#B8EE68]"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs leading-relaxed text-[#93A39C]">
              <p>
                <strong className="text-[#EFF5ED]">Armonización MODIS y VIIRS: </strong>
                Para permitir comparar 24 años continuos de historia satelital en Argentina (2000 hasta hoy), los conteos del sensor MODIS (1 km) se armonizan estadísticamente a la escala del sensor VIIRS (375 m).
              </p>

              <div className="rounded-xl border border-[#21312D] bg-[#111E1B] p-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-7 rounded border border-dashed border-[#93A39C] pattern-estimado" />
                  <span className="font-semibold text-[#EFF5ED]">
                    Período 2000–2012 (Datos Estimados):
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#93A39C]">
                  Antes del lanzamiento de Suomi NPP en 2012, solo operaba el instrumento MODIS. Los valores mensuales de esos años son estimaciones calibradas acompañadas de su intervalo de predicción.
                </p>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-[#21312D]/80 bg-[#07100F] p-3">
                <ShieldAlert className="h-4 w-4 shrink-0 text-[#FF9C55] mt-0.5" />
                <p className="text-[11px] text-[#93A39C]">
                  <strong className="text-[#EFF5ED]">Sin dato ≠ Cero: </strong>
                  Si un satélite no sobrevoló la zona o no estaba en operación, la celda se clasifica rigurosamente como <em className="text-[#EFF5ED]">"sin dato"</em> y jamás como cero focos.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMethodOpen(false)}
                className="rounded-lg bg-[#B8EE68] px-4 py-2 font-mono text-xs font-bold text-[#07100F] hover:bg-[#cbf58c] focus:outline-none focus:ring-2 focus:ring-[#B8EE68] focus:ring-offset-2 focus:ring-offset-[#07100F] transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
