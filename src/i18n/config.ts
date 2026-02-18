import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'
import es from './locales/es.json'
import ar from './locales/ar.json'

// Get saved language or detect from browser
const savedLanguage = localStorage.getItem('oneiro_language')
const detectedLanguage = savedLanguage || (typeof window !== 'undefined' 
  ? navigator.language.split('-')[0] 
  : 'en')

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
      ja: { translation: ja },
      es: { translation: es },
      ar: { translation: ar },
    },
    lng: ['en', 'ko', 'ja', 'es', 'ar'].includes(detectedLanguage) ? detectedLanguage : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
