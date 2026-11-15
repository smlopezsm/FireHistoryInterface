import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle, X } from 'lucide-react';
import { useDialogA11y } from './useDialogA11y';

export interface MethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const sources = [
  { label: 'sourceFirms', url: 'https://firms.modaps.eosdis.nasa.gov/' },
  { label: 'sourcePipeline', url: 'https://github.com/DenisPablo/ML_NasaSpaceApp/blob/eaa733f4038d0b0600aebfa27410fa573f0ac8c1/CLASIFICACION.md' },
  { label: 'sourceValidation', url: 'https://github.com/DenisPablo/ML_NasaSpaceApp/tree/eaa733f4038d0b0600aebfa27410fa573f0ac8c1/analisis/veredicto-armonizacion' },
  { label: 'sourceApi', url: 'https://github.com/smlopezsm/FireHistoryInterfaceAPI/blob/2b2ec70/docs/04-logica-de-armonizacion.md' },
];

export const MethodDialog: React.FC<MethodDialogProps> = ({ isOpen, onClose }) => {
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
      aria-labelledby="method-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-xl border border-[#21312D] bg-[#0D1816] text-[#EFF5ED] shadow-[0_12px_32px_rgba(0,0,0,0.65)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#21312D] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 shrink-0 text-[#B8EE68]" aria-hidden="true" />
            <h2
              id="method-dialog-title"
              className="font-title text-base font-bold text-[#EFF5ED]"
            >
              {t('methodDialog.title')}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 text-[#93A39C] hover:bg-[#111E1B] hover:text-[#EFF5ED] focus:outline-none focus:ring-2 focus:ring-[#B8EE68] transition-colors"
            aria-label={t('methodDialog.closeDialog', { defaultValue: 'Close' })}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          role="region"
          aria-labelledby="method-dialog-title"
          tabIndex={0}
          className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 text-sm leading-relaxed text-[#C2D2C9] focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-[#B8EE68] sm:px-6 [&_h3]:font-semibold [&_h3]:text-[#EFF5ED]"
        >
          <section className="space-y-2">
            <h3>{t('methodDialog.measureTitle')}</h3>
            <p>{t('methodDialog.measure')}</p>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.calculationTitle')}</h3>
            <p>{t('methodDialog.observation')}</p>
            <p className="rounded-md border border-[#21312D] bg-[#111E1B] px-3 py-2 font-semibold text-[#B8EE68]">
              {t('methodDialog.formula')}
            </p>
            <p>{t('methodDialog.referenceSatellites')}</p>
            <p>{t('methodDialog.calibration')}</p>
            <p>{t('methodDialog.example')}</p>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.readingTitle')}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('methodDialog.observed')}</li>
              <li>{t('methodDialog.mixed')}</li>
              <li>{t('methodDialog.estimated')}</li>
            </ul>
            <p>{t('methodDialog.availability')}</p>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.uncertaintyTitle')}</h3>
            <p>{t('methodDialog.uncertainty')}</p>
            <p>{t('methodDialog.validation')}</p>
            <p>{t('methodDialog.confidence')}</p>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.comparisonTitle')}</h3>
            <p>{t('methodDialog.comparison')}</p>
            <p>{t('methodDialog.comparisonThresholds')}</p>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.limitsTitle')}</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t('methodDialog.limitBeforeViirs')}</li>
              <li>{t('methodDialog.limitAvailability')}</li>
              <li>{t('methodDialog.limitOrbit')}</li>
            </ul>
          </section>
          <section className="space-y-2">
            <h3>{t('methodDialog.sourcesTitle')}</h3>
            <ul className="list-disc space-y-1 pl-5">
              {sources.map(({ label, url }) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noreferrer" className="text-[#B8EE68] underline underline-offset-2">
                    {t(`methodDialog.${label}`)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-[#21312D] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#B8EE68] px-4 py-2 font-sans text-xs font-semibold text-[#07100F] hover:bg-[#cbf58c] focus:outline-none focus:ring-2 focus:ring-[#B8EE68] focus:ring-offset-2 focus:ring-offset-[#07100F] transition-all"
          >
            {t('methodDialog.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
