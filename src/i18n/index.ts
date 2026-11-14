import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import en from './en.json';

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam === 'en' || langParam === 'es') {
      return langParam;
    }
  }
  return import.meta.env.VITE_DEFAULT_LANG || 'es';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
