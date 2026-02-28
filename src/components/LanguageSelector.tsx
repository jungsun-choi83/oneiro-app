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
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-tertiary bg-[#0F1629] hover:bg-[#1A2240] transition-all text-white shadow-lg"
        style={{ backgroundColor: '#0F1629' }}
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="text-sm font-medium">{currentLang.name}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute top-full mt-2 right-0 z-[100] rounded-lg shadow-xl overflow-hidden min-w-[160px] border border-indigo/50"
            style={{ backgroundColor: '#0F1629' }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-indigo/40 text-indigo-200'
                    : 'text-white hover:bg-[#1A2240]'
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
