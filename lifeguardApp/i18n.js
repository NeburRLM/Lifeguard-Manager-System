import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import ca from './locales/ca.json';

const getSavedLanguage = async () => {
  try {
    // Intenta cargar el idioma guardado en AsyncStorage
    const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
    return savedLanguage || 'es'; // Si no hay ninguno guardado, usa español como predeterminado
  } catch (error) {
    console.error('Error fetching saved language:', error);
    return 'es'; // Usa español como predeterminado en caso de error
  }
};

(async () => {
  const savedLanguage = await getSavedLanguage(); // Obtén el idioma guardado

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        es: { translation: es },
        ca: { translation: ca },
      },
      lng: savedLanguage, // Usa el idioma guardado dinámicamente
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
})();

export default i18n;