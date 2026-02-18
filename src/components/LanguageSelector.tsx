import { useTranslation } from 'react-i18next'
import { useState } from 'react'

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const currentLang = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0]

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('oneiro_language', langCode)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tertiary bg-secondary/50 hover:bg-secondary transition-all text-white"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="text-sm font-medium">{currentLang.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-secondary border border-tertiary rounded-lg shadow-lg overflow-hidden min-w-[160px]">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-tertiary transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-indigo/20 text-indigo-light'
                    : 'text-white'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto text-indigo-light">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
