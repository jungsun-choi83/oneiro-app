import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'
import ReferralSystem from '../components/ReferralSystem'

interface ResultProps {
  fullReading?: boolean
}

export default function Result({ fullReading = false }: ResultProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamResult, dreamText, mood, isRecurring, addToJournal, userProfile } = useDreamStore()
  const [unlocked, setUnlocked] = useState(fullReading || userProfile?.freeReadingsUsed === 0)
  const [showBlur, setShowBlur] = useState(!unlocked && dreamResult?.deepInsight)

  useEffect(() => {
    if (!dreamResult) {
      navigate('/dream')
    }
  }, [dreamResult, navigate])

  if (!dreamResult) return null

  const handleUnlock = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) return

    // Check for free credits first
    if (supabase && import.meta.env.VITE_SUPABASE_URL) {
      try {
        const { data: user } = await supabase
          .from('dream_users')
          .select('free_credits_earned')
          .eq('telegram_id', telegramUserId)
          .single()

        if (user && user.free_credits_earned > 0) {
          // Use free credit
          await supabase
            .from('dream_users')
            .update({ free_credits_earned: user.free_credits_earned - 1 })
            .eq('telegram_id', telegramUserId)

          setUnlocked(true)
          setShowBlur(false)
          window.Telegram?.WebApp?.showAlert?.('Free credit used! Enjoy your full reading.')
          return
        }
      } catch (err) {
        console.error('Error checking free credits:', err)
      }
    }

    // Proceed with payment
    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'full_reading',
          telegramUserId,
        },
      })

      if (error) throw error

      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
          if (status === 'paid') {
            setUnlocked(true)
            setShowBlur(false)
            // Update user profile
            if (userProfile) {
              useDreamStore.getState().setUserProfile({
                ...userProfile,
                freeReadingsUsed: userProfile.freeReadingsUsed + 1,
              })
            }
          }
        })
      }
    } catch (err) {
      console.error('Payment error:', err)
      window.Telegram?.WebApp?.showAlert?.('Payment failed. Please try again.')
    }
  }

  const handleVisualize = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) return

    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'dream_visualizer',
          telegramUserId,
        },
      })

      if (error) throw error

      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
          if (status === 'paid') {
            navigate('/visualize')
          }
        })
      }
    } catch (err) {
      console.error('Payment error:', err)
    }
  }

  const handleReport = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) return

    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'soul_report',
          telegramUserId,
        },
      })

      if (error) throw error

      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
          if (status === 'paid') {
            navigate('/report')
          }
        })
      }
    } catch (err) {
      console.error('Payment error:', err)
    }
  }

  const handleShare = () => {
    const shareText = `🔮 My dream holds a secret message... Check your own destiny with AI Dream Guide ONEIRO! 🌙\n\n${dreamResult.hiddenMeaning || dreamResult.essence}\n\nDiscover what your dreams are telling you: https://t.me/ONEIROBot`
    
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareText)}`
      )
    }
  }

  const handleSave = () => {
    if (dreamResult) {
      addToJournal({
        id: Date.now().toString(),
        dreamText,
        mood,
        isRecurring,
        result: dreamResult,
        fullReadingUnlocked: unlocked,
        createdAt: new Date().toISOString(),
      })
      window.Telegram?.WebApp?.showAlert?.('Saved to Dream Journal!')
    }
  }

  // For unlocked users, show full structured content
  // For locked users, show only first part of deepInsight
  const insightSentences = dreamResult.deepInsight ? dreamResult.deepInsight.split(/[.!?]+/).filter(s => s.trim()) : []
  const visibleText = unlocked 
    ? (dreamResult.psychologicalShadow && dreamResult.easternProphecy && dreamResult.spiritualAdvice 
        ? dreamResult.deepInsight 
        : dreamResult.deepInsight)
    : (insightSentences.length > 0 ? insightSentences.slice(0, 2).join('. ') + '.' : '')

  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
      <div className="max-w-2xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        {/* The Hidden Meaning - Cliffhanger Style */}
        <div className="card mb-6 bg-gradient-to-br from-indigo/20 to-purple/20 border-indigo/50">
          <h2 className="text-sm font-semibold text-indigo-light mb-2 uppercase tracking-wide">
            {t('result.hiddenMeaning', { defaultValue: 'The Hidden Meaning' })}
          </h2>
          <p className="text-xl font-title font-bold text-white leading-relaxed">
            {dreamResult.hiddenMeaning || dreamResult.essence}
          </p>
        </div>

        {/* The Essence */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-indigo-light mb-2 uppercase tracking-wide">
            {t('result.essence')}
          </h2>
          <p className="text-lg font-title text-white">
            {dreamResult.essence}
          </p>
        </div>

        {/* Key Symbols */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
            {t('result.symbols')}
          </h2>
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

        {/* Deep Insight */}
        <div className="card mb-6 relative">
          <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
            {t('result.insight')}
          </h2>
          <div className="relative">
            {unlocked && dreamResult.psychologicalShadow && dreamResult.easternProphecy && dreamResult.spiritualAdvice ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">1)</span> Psychological Shadow
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {dreamResult.psychologicalShadow}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">2)</span> Eastern Prophecy
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {dreamResult.easternProphecy}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">3)</span> Spiritual Advice
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {dreamResult.spiritualAdvice}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                  {visibleText}
                </p>
                {showBlur && (
                  <>
                    <div className="absolute inset-0 bg-gradient-midnight blur-sm" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={handleUnlock}
                        className="btn-primary z-10"
                      >
                        {t('result.unlock')} — {t('result.stars', { count: 50 })}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actionable Advice (Unlocked) */}
        {unlocked && (
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
              {t('result.advice')}
            </h2>
            <div className="space-y-3">
              {dreamResult.advice.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg border border-tertiary"
                >
                  <span className="text-indigo text-xl">•</span>
                  <p className="text-text-primary flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spiritual Message (Unlocked) */}
        {unlocked && (
          <div className="card mb-6">
            <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
              {t('result.spiritual')}
            </h2>
            <p className="text-text-primary leading-relaxed italic">
              {dreamResult.spiritualMessage}
            </p>
          </div>
        )}

        {/* Upsell Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card cursor-pointer hover:shadow-moonlight transition-all" onClick={handleVisualize}>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('result.upsell.visualize.title')}
            </h3>
            <p className="text-text-secondary mb-4">
              {t('result.upsell.visualize.description')}
            </p>
            <div className="text-indigo-light font-semibold">
              {t('result.upsell.visualize.price')}
            </div>
          </div>

          <div className="card cursor-pointer hover:shadow-moonlight transition-all" onClick={handleReport}>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('result.upsell.report.title')}
            </h3>
            <p className="text-text-secondary mb-4">
              {t('result.upsell.report.description')}
            </p>
            <div className="text-indigo-light font-semibold">
              {t('result.upsell.report.price')}
            </div>
          </div>
        </div>

        {/* Referral System */}
        <ReferralSystem />

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button onClick={handleShare} className="btn-primary flex-1">
            {t('result.share')}
          </button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {t('result.save')}
          </button>
        </div>

        {/* Cross Promotion */}
        <div className="text-center text-text-secondary text-sm">
          {t('result.crossPromo')}
        </div>
      </div>
    </div>
  )
}
