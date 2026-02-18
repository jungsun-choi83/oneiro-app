import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'

interface DailySymbol {
  emoji: string
  name: string
  meaning: string
}

export default function Home() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamJournal } = useDreamStore()
  const [dailySymbol, setDailySymbol] = useState<DailySymbol | null>(null)
  const [recentDreams, setRecentDreams] = useState<any[]>([])

  useEffect(() => {
    const checkFirstVisit = () => {
      const hasVisited = localStorage.getItem('oneiro_visited')
      if (!hasVisited) {
        localStorage.setItem('oneiro_visited', 'true')
        navigate('/dream')
        return
      }
    }

    checkFirstVisit()
    loadDailySymbol()
    loadRecentDreams()
  }, [navigate])

  const loadDailySymbol = async () => {
    const cached = localStorage.getItem('oneiro_daily_symbol')
    const cachedDate = localStorage.getItem('oneiro_daily_symbol_date')
    const today = new Date().toDateString()

    if (cached && cachedDate === today) {
      setDailySymbol(JSON.parse(cached))
      return
    }

    // Fallback symbol if Supabase is not configured
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
      setDailySymbol({
        emoji: '🌙',
        name: 'Moon',
        meaning: 'Your subconscious is speaking. Listen carefully.',
      })
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('daily-symbol', {
        body: { date: today },
      })

      if (!error && data) {
        setDailySymbol(data)
        localStorage.setItem('oneiro_daily_symbol', JSON.stringify(data))
        localStorage.setItem('oneiro_daily_symbol_date', today)
      } else {
        // Fallback on error
        setDailySymbol({
          emoji: '🌙',
          name: 'Moon',
          meaning: 'Your subconscious is speaking. Listen carefully.',
        })
      }
    } catch (err) {
      console.error('Error loading daily symbol:', err)
      // Fallback on error
      setDailySymbol({
        emoji: '🌙',
        name: 'Moon',
        meaning: 'Your subconscious is speaking. Listen carefully.',
      })
    }
  }

  const loadRecentDreams = async () => {
    const telegramUserId = getTelegramUserId()
    
    // Use local journal if no Supabase
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
      setRecentDreams(dreamJournal.slice(0, 3))
      return
    }

    if (!telegramUserId) {
      setRecentDreams(dreamJournal.slice(0, 3))
      return
    }

    try {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('telegram_id', telegramUserId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (!error && data) {
        setRecentDreams(data)
      } else {
        setRecentDreams(dreamJournal.slice(0, 3))
      }
    } catch (err) {
      console.error('Error loading recent dreams:', err)
      setRecentDreams(dreamJournal.slice(0, 3))
    }
  }

  const galleryImages = dreamJournal
    .filter(entry => entry.imageUrl)
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
      <div className="max-w-2xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌙</div>
          <h1 className="text-3xl font-title font-bold text-white mb-2">
            {t('app.name')}
          </h1>
          <p className="text-text-secondary">{t('app.tagline')}</p>
        </div>

        {/* Daily Symbol */}
        {dailySymbol && (
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
              {t('home.dailySymbol')}
            </h2>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{dailySymbol.emoji}</div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{dailySymbol.name}</h3>
                <p className="text-text-primary">{dailySymbol.meaning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => navigate('/dream')}
            className="card hover:shadow-moonlight transition-all text-left"
          >
            <div className="text-2xl mb-2">✨</div>
            <h3 className="text-lg font-semibold text-white">
              {t('home.quickActions.newDream')}
            </h3>
          </button>
          <button
            onClick={() => navigate('/journal')}
            className="card hover:shadow-moonlight transition-all text-left"
          >
            <div className="text-2xl mb-2">📖</div>
            <h3 className="text-lg font-semibold text-white">
              {t('home.quickActions.journal')}
            </h3>
          </button>
        </div>

        {/* Recent Dreams */}
        {recentDreams.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
              {t('home.recent')}
            </h2>
            <div className="space-y-3">
              {recentDreams.map((dream) => (
                <div
                  key={dream.id}
                  onClick={() => navigate('/result')}
                  className="p-4 bg-secondary/50 rounded-lg border border-tertiary cursor-pointer hover:border-indigo/50 transition-all"
                >
                  <div className="text-xs text-text-secondary mb-2">
                    {new Date(dream.created_at || dream.id).toLocaleDateString()}
                  </div>
                  <p className="text-white font-medium mb-2">
                    {dream.result?.essence || dream.dreamText?.substring(0, 50)}
                  </p>
                  {dream.result?.symbols && (
                    <div className="flex flex-wrap gap-2">
                      {dream.result.symbols.slice(0, 3).map((s: any, idx: number) => (
                        <span key={idx} className="text-sm text-indigo-light">
                          {s.emoji} {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dream Gallery */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
            {t('home.gallery')}
          </h2>
          {galleryImages.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {galleryImages.map((entry) => (
                <img
                  key={entry.id}
                  src={entry.imageUrl}
                  alt={entry.artTitle || 'Dream art'}
                  className="w-32 h-32 object-cover rounded-lg border border-tertiary flex-shrink-0"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">{t('home.noGallery')}</p>
              <button
                onClick={() => navigate('/dream')}
                className="btn-primary"
              >
                {t('home.quickActions.newDream')}
              </button>
            </div>
          )}
        </div>

        {/* Cross Promotion */}
        <div className="text-center text-text-secondary text-sm">
          {t('home.crossPromo')}
        </div>
      </div>
    </div>
  )
}
