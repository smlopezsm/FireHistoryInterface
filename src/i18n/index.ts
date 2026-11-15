import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';

type Idioma = 'es' | 'en';

/**
 * Idioma inicial: `?lang=` si viene en la URL; si no, el primer idioma del navegador que
 * soportamos (`navigator.languages`); si ninguno coincide, `VITE_DEFAULT_LANG` o español,
 * porque el público principal es argentino.
 */
export function idiomaInicial(busqueda: string, idiomasNavegador: readonly string[]): Idioma {
  const param = new URLSearchParams(busqueda).get('lang');
  if (param === 'en' || param === 'es') return param;
  for (const idioma of idiomasNavegador) {
    const base = idioma.toLowerCase().split('-')[0];
    if (base === 'es' || base === 'en') return base;
  }
  const porDefecto = import.meta.env.VITE_DEFAULT_LANG;
  return porDefecto === 'en' ? 'en' : 'es';
}

const enNavegador = typeof window !== 'undefined';

// Lectores de pantalla y traductores usan `<html lang>`: tiene que seguir al idioma activo.
i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng.split('-')[0];
});

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: enNavegador
    ? idiomaInicial(window.location.search, navigator.languages?.length ? navigator.languages : [navigator.language])
    : 'es',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
