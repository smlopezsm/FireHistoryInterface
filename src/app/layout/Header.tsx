import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Globe, HelpCircle, Orbit } from 'lucide-react';

interface HeaderProps {
  onOpenMethod?: () => void;
  onOpenSatellites?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMethod, onOpenSatellites }) => {
  const { t, i18n } = useTranslation();
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#21312D] bg-[#07100F]/95 backdrop-blur-md px-4 py-2.5 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Marca FuegoContinuo y credencial */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF6759]/40 bg-[#FF6759]/10 text-[#FF6759]">
            <Flame className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-title text-lg md:text-xl font-bold tracking-tight text-[#EFF5ED]">
                {t('header.title')}
              </h1>
              <span className="rounded border border-[#FF9C55]/40 bg-[#FF9C55]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FF9C55]">
                {t('header.badge')}
              </span>
            </div>
            <p className="hidden font-mono text-[11px] text-[#93A39C] sm:block">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        {/* Navegación central: Explorar / Calendario / La misión */}
        <nav
          aria-label="Secciones principales"
          className="hidden md:flex items-center gap-1 font-mono text-xs text-[#93A39C] rounded-lg border border-[#21312D] bg-[#0D1816] p-1"
        >
          <button
            type="button"
            onClick={() => scrollToSection('explorar')}
            className="rounded px-3 py-1 hover:text-[#EFF5ED] hover:bg-[#111E1B] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {t('header.nav.explore')}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('calendario')}
            className="rounded px-3 py-1 hover:text-[#EFF5ED] hover:bg-[#111E1B] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {t('header.nav.calendar')}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('la-mision')}
            className="rounded px-3 py-1 hover:text-[#EFF5ED] hover:bg-[#111E1B] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
          >
            {t('header.nav.mission')}
          </button>
        </nav>

        {/* Acciones de cabecera */}
        <div className="flex items-center gap-2">
          {/* Visor 3D de Satélites NASA */}
          <button
            type="button"
            onClick={onOpenSatellites}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8EE68]/40 bg-[#B8EE68]/15 px-3 py-1.5 font-mono text-xs font-semibold text-[#B8EE68] hover:bg-[#B8EE68]/25 hover:border-[#B8EE68] transition-all focus:outline-none focus:ring-2 focus:ring-[#B8EE68]"
            title={t('header.satelliteViewer')}
          >
            <Orbit className="h-3.5 w-3.5 text-[#B8EE68]" aria-hidden="true" />
            <span>{t('header.satelliteViewer')}</span>
          </button>

          {/* Modal del Método */}
          <button
            type="button"
            onClick={onOpenMethod}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#21312D] bg-[#0D1816] px-2.5 py-1.5 font-mono text-xs text-[#93A39C] hover:border-[#2A3F3A] hover:bg-[#111E1B] hover:text-[#EFF5ED] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
            title={t('header.methodLink')}
          >
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('header.methodLink')}</span>
          </button>

          <div className="h-4 w-[1px] bg-[#21312D]" />

          {/* Alternador de idioma */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#21312D] bg-[#0D1816] px-2.5 py-1.5 font-mono text-xs font-semibold text-[#EFF5ED] hover:bg-[#111E1B] hover:border-[#2A3F3A] transition-colors focus:outline-none focus:ring-1 focus:ring-[#B8EE68]"
            aria-label={`${t('header.lang')}: ${(i18n?.language || 'en').toUpperCase()}`}
          >
            <Globe className="h-3.5 w-3.5 text-[#93A39C]" aria-hidden="true" />
            <span>{isSpanish ? 'EN' : 'ES'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
