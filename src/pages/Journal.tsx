import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import LanguageSelector from '../components/LanguageSelector'

export default function Journal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamJournal } = useDreamStore()

  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
      <div className="max-w-2xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-title font-bold text-white mb-2">
            {t('journal.title')}
          </h1>
        </div>

        {dreamJournal.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-text-secondary text-lg">{t('journal.empty')}</p>
            <button
              onClick={() => navigate('/dream')}
              className="btn-primary mt-6"
            >
              {t('home.quickActions.newDream')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {dreamJournal.map((entry) => (
              <div
                key={entry.id}
                onClick={() => navigate('/result')}
                className="card cursor-pointer hover:shadow-moonlight transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs text-text-secondary">
                    {t('journal.date')}: {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                  {entry.isRecurring && (
                    <span className="text-xs text-indigo-light">🔄 {t('dream.moods.recurring')}</span>
                  )}
                </div>
                <p className="text-white mb-3 line-clamp-2">{entry.dreamText}</p>
                {entry.result && (
                  <div className="mb-3">
                    <p className="text-indigo-light font-semibold mb-2">
                      {entry.result.essence}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.result.symbols.map((symbol, idx) => (
                        <span
                          key={idx}
                          className="text-sm px-2 py-1 bg-indigo/20 border border-indigo/30 rounded"
                        >
                          {symbol.emoji} {symbol.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {entry.imageUrl && (
                  <img
                    src={entry.imageUrl}
                    alt={entry.artTitle || 'Dream visualization'}
                    className="w-full h-32 object-cover rounded-lg mt-3"
                  />
                )}
                <button className="mt-4 text-indigo-light text-sm font-semibold">
                  {t('journal.view')} →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
