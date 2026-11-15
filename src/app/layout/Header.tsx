import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Globe, HelpCircle, Layers3, Orbit } from 'lucide-react';
import { useMetadata } from '../../api';
import { BackendHealthIndicator } from './BackendHealthIndicator';

interface HeaderProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
  onStartGuide: () => void;
  onStartHarmonization: () => void;
  guideButtonRef?: React.Ref<HTMLButtonElement>;
  harmonizationButtonRef?: React.Ref<HTMLButtonElement>;
}

const guideButtonClass = 'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-[#B8EE68] px-2.5 py-1.5 text-center font-semibold leading-tight text-[#07100F] transition-colors hover:bg-[#CBF58C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8EE68] lg:flex-none lg:whitespace-nowrap xl:gap-2 xl:px-3';
const actionButtonClass = 'inline-flex h-9 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#21312D] bg-[#0D1816] px-1.5 font-sans text-xs font-medium text-[#EFF5ED] transition-colors hover:border-[#B8EE68]/40 hover:bg-[#111E1B] hover:text-[#B8EE68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B8EE68] sm:min-w-9 xl:px-2.5';

export const Header: React.FC<HeaderProps> = ({ onOpenMethod, onOpenSatellites, onStartGuide, onStartHarmonization, guideButtonRef, harmonizationButtonRef }) => {
  const { t, i18n } = useTranslation();
  const { data: metadata } = useMetadata();
  const isSpanish = Boolean(i18n?.language?.startsWith('es'));

  const toggleLanguage = () => {
    const nextLang = isSpanish ? 'en' : 'es';
    i18n.changeLanguage(nextLang);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', nextLang);
      window.history.replaceState({}, '', url.toString());
      document.documentElement.lang = nextLang;
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#21312D] bg-[#07100F]/95 px-3 py-2.5 backdrop-blur-md sm:px-4 md:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2.5 sm:gap-x-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] xl:gap-x-4">
        <div className="flex min-w-0 items-center gap-2 xl:gap-3">
          <img
            src={`${import.meta.env.BASE_URL}fire-history-interface.png`}
            alt=""
            width={48}
            height={48}
            className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 xl:h-12 xl:w-12"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2">
              <h1 className="font-title text-sm font-bold leading-tight tracking-tight text-[#EFF5ED] sm:text-base xl:text-lg">
                {t('header.title')}
              </h1>
              {metadata?.factores_version && (
                <span className="hidden whitespace-nowrap rounded border border-[#21312D] bg-[#111E1B] px-1.5 py-0.5 font-mono text-[11px] text-[#93A39C] sm:inline-block">
                  v{metadata.factores_version}
                </span>
              )}
            </div>
            <p className="mt-0.5 hidden truncate text-xs text-[#93A39C] sm:block">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        <nav
          aria-label="Secciones principales"
          className="col-span-2 row-start-2 flex items-stretch gap-2 font-sans text-xs lg:col-span-1 lg:col-start-2 lg:row-start-1"
        >
          <button
            type="button"
            ref={guideButtonRef}
            onClick={onStartGuide}
            className={guideButtonClass}
          >
            <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('cordoba.guideLink')}
          </button>
          <button
            type="button"
            ref={harmonizationButtonRef}
            onClick={onStartHarmonization}
            className={guideButtonClass}
          >
            <Layers3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('pampa.guideLink')}
          </button>
        </nav>

        <div className="col-start-2 row-start-1 flex items-center gap-1 sm:gap-1.5 lg:col-start-3">
          <BackendHealthIndicator />

          <button
            type="button"
            onClick={onOpenSatellites}
            aria-label={t('header.satelliteViewer')}
            className={actionButtonClass}
            title={t('header.satelliteViewer')}
          >
            <Orbit className="h-4 w-4 text-[#B8EE68]" aria-hidden="true" />
            <span className="hidden whitespace-nowrap xl:inline">{t('header.satelliteViewer')}</span>
          </button>

          {/* Modal del Método */}
          <button
            type="button"
            id="metodo-armonizacion"
            onClick={onOpenMethod}
            aria-label={t('header.methodLink')}
            className={actionButtonClass}
            title={t('header.methodLink')}
          >
            <HelpCircle className="h-4 w-4 text-[#93A39C]" aria-hidden="true" />
            <span className="hidden whitespace-nowrap xl:inline">{t('header.methodLink')}</span>
          </button>

          {/* Alternador de idioma */}
          <button
            type="button"
            onClick={toggleLanguage}
            className={actionButtonClass}
            aria-label={`${t('header.lang')}: ${(i18n?.language || 'en').toUpperCase()}`}
          >
            <Globe className="hidden h-4 w-4 text-[#93A39C] xl:inline" aria-hidden="true" />
            <span>{isSpanish ? 'EN' : 'ES'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
