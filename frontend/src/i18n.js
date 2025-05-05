import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './Locales/en/translation.json';
import translationES from './Locales/es/translation.json';
import translationCA from './Locales/ca/translation.json';

const resources = {
  en: { translation: translationEN },
  es: { translation: translationES },
  ca: { translation: translationCA },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // idioma por defecto
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
