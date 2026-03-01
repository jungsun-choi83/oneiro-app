import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import ko from './locales/ko.json'
import ja from './locales/ja.json'
import es from './locales/es.json'
import ar from './locales/ar.json'

// 저장된 언어 우선 사용 (LanguageDetector와 동일 키 사용)
const savedLanguage = typeof window !== 'undefined'
  ? (localStorage.getItem('oneiro_language') || localStorage.getItem('i18nextLng'))
  : null
const detectedLanguage = savedLanguage || (typeof window !== 'undefined'
  ? navigator.language.split('-')[0]
  : 'en')
const initialLng = ['en', 'ko', 'ja', 'es', 'ar'].includes(detectedLanguage) ? detectedLanguage : 'en'

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
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'oneiro_language',
      caches: ['localStorage'],
    },
  })

export default i18n
