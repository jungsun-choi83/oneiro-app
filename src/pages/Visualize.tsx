import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'

export default function Visualize() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamText, dreamResult, dreamImage, artTitle, setDreamImage, setArtTitle } = useDreamStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateImage = async () => {
      if (dreamImage) {
        setLoading(false)
        return
      }

      try {
        const telegramUserId = getTelegramUserId()
        if (!telegramUserId || !dreamResult) {
          throw new Error('Missing data')
        }

        const { data, error: apiError } = await supabase.functions.invoke('visualize-dream', {
          body: {
            dreamText,
            symbols: dreamResult.symbols.map(s => `${s.emoji} ${s.name}`),
            emotionalTone: dreamResult.emotionalTone,
            telegramUserId,
          },
        })

        if (apiError) throw apiError

        setDreamImage(data.imageUrl)
        setArtTitle(data.artTitle)
        setLoading(false)
      } catch (err) {
        console.error('Error generating image:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    generateImage()
  }, [dreamText, dreamResult, dreamImage, setDreamImage, setArtTitle])

  const handleSave = () => {
    if (dreamImage) {
      const link = document.createElement('a')
      link.href = dreamImage
      link.download = `${artTitle || 'dream-art'}.png`
      link.click()
    }
  }

  const handleShare = () => {
    if (dreamImage && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(dreamImage)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
      <div className="max-w-2xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-pulse">🌙</div>
            <p className="text-xl text-white mb-8">{t('visualize.loading')}</p>
            <div className="w-full bg-tertiary rounded-full h-2">
              <div className="h-full bg-gradient-indigo animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{t('visualize.error')}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('visualize.retry')}
            </button>
          </div>
        ) : dreamImage ? (
          <>
            <div className="card mb-6">
              <div className="relative">
                <img
                  src={dreamImage}
                  alt="Dream visualization"
                  className="w-full rounded-lg border-4 border-indigo/50 shadow-moonlight-lg"
                />
              </div>
            </div>

            {artTitle && (
              <div className="card mb-6">
                <h2 className="text-sm font-semibold text-indigo-light mb-2 uppercase tracking-wide">
                  {t('visualize.title')}
                </h2>
                <p className="text-2xl font-title font-bold text-white">{artTitle}</p>
              </div>
            )}

            {dreamResult && (
              <div className="card mb-6">
                <div className="flex flex-wrap gap-3">
                  {dreamResult.symbols.map((symbol, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 bg-indigo/20 border border-indigo/30 rounded-lg"
                    >
                      <span className="text-lg mr-2">{symbol.emoji}</span>
                      <span className="text-white font-medium">{symbol.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mb-6">
              <button onClick={handleSave} className="btn-primary flex-1">
                {t('visualize.save')}
              </button>
              <button onClick={handleShare} className="btn-primary flex-1">
                {t('visualize.share')}
              </button>
            </div>

            <button
              onClick={() => navigate('/dream')}
              className="btn-primary w-full"
            >
              {t('visualize.another')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
