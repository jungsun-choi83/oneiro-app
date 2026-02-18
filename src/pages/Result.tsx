import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  const [hydrated, setHydrated] = useState(false)
  const lastActionRef = useRef<{ name: string; time: number }>({ name: '', time: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const handlersRef = useRef<{
    visualize: () => void
    report: () => void
    share: () => void
    save: () => void
    unlock: () => void
  }>(null as any)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !dreamResult) {
      navigate('/dream')
    }
  }, [hydrated, dreamResult, navigate])

  if (!dreamResult) {
    if (!hydrated) return <div className="min-h-screen bg-gradient-midnight flex items-center justify-center"><div className="text-text-secondary">Loading...</div></div>
    return null
  }

  const showMsg = (msg: string) => {
    try {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(msg)
      } else {
        alert(msg)
      }
    } catch {
      alert(msg)
    }
  }

  const isInTelegram = typeof window !== 'undefined' && !!window.Telegram?.WebApp
  const openInTelegramMsg = isInTelegram
    ? t('result.openInTelegramFromMenu', { defaultValue: '봇 메뉴 버튼에서 앱을 다시 열어주세요. (결제·크레딧은 텔레그램 앱 내에서만 가능합니다)' })
    : t('result.openInTelegram', { defaultValue: '결제는 텔레그램에서 봇을 열어 이용해 주세요.' })

  const handleUnlock = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      showMsg(openInTelegramMsg)
      return
    }

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
          showMsg('Free credit used! Enjoy your full reading.')
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

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            if (status === 'paid') {
              setUnlocked(true)
              setShowBlur(false)
              if (userProfile) {
                useDreamStore.getState().setUserProfile({
                  ...userProfile,
                  freeReadingsUsed: userProfile.freeReadingsUsed + 1,
                })
              }
            }
          })
        } else {
          showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇 메뉴로 앱을 열어주세요.')
        }
      } catch (e) {
        showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 이용해 주세요.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      showMsg('결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleVisualize = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      showMsg(openInTelegramMsg)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'dream_visualizer',
          telegramUserId,
        },
      })

      if (error) throw error

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            if (status === 'paid') navigate('/visualize')
          })
        } else {
          showMsg('결제는 텔레그램 앱에서 봇을 열어 이용해 주세요.')
        }
      } catch {
        showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 주세요.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      showMsg('결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleReport = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      showMsg(openInTelegramMsg)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'soul_report',
          telegramUserId,
        },
      })

      if (error) throw error

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            if (status === 'paid') navigate('/report')
          })
        } else {
          showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇 메뉴로 앱을 열어주세요.')
        }
      } catch {
        showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 주세요.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      showMsg('결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const handleShare = () => {
    const shareText = `🔮 My dream holds a secret message... Check your own destiny with AI Dream Guide ONEIRO! 🌙\n\n${dreamResult.hiddenMeaning || dreamResult.essence}\n\nDiscover what your dreams are telling you: https://t.me/ONEIRO83Bot`
    try {
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(
          `https://t.me/share/url?url=${encodeURIComponent(shareText)}`
        )
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          showMsg(t('result.copied', { defaultValue: '공유 문구가 복사되었습니다. 원하는 곳에 붙여넣기 하세요.' }))
        }).catch(() => showMsg(shareText))
      }
    } catch (err) {
      showMsg(t('result.copied', { defaultValue: '공유 문구가 복사되었습니다.' }))
    }
  }

  const handleSave = () => {
    if (!dreamResult) return
    try {
      addToJournal({
        id: Date.now().toString(),
        dreamText,
        mood,
        isRecurring,
        result: dreamResult,
        fullReadingUnlocked: unlocked,
        createdAt: new Date().toISOString(),
      })
      showMsg(t('result.saved', { defaultValue: '꿈 일기에 저장되었습니다!' }))
    } catch (e) {
      console.error('Save journal error:', e)
      showMsg(t('result.saveFailed', { defaultValue: '저장에 실패했습니다. 다시 시도해 주세요.' }))
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

  // 위임 클릭: 텔레그램 웹뷰에서 버튼 onClick이 안 먹을 때를 대비해, 영역 터치만으로 동작
  const handleDelegatedAction = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest('[data-result-action]')
    if (!el) return
    const action = el.getAttribute('data-result-action')
    if (!action) return
    const now = Date.now()
    if (lastActionRef.current.name === action && now - lastActionRef.current.time < 500) return
    lastActionRef.current = { name: action, time: now }
    e.preventDefault()
    e.stopPropagation()
    if (action === 'test') {
      try {
        if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert('클릭됨!')
        else alert('클릭됨!')
      } catch {
        alert('클릭됨!')
      }
      return
    }
    if (action === 'visualize') handleVisualize()
    else if (action === 'report') handleReport()
    else if (action === 'share') handleShare()
    else if (action === 'save') handleSave()
    else if (action === 'unlock') handleUnlock()
  }

  handlersRef.current = {
    visualize: handleVisualize,
    report: handleReport,
    share: handleShare,
    save: handleSave,
    unlock: handleUnlock,
  }

  // document 레벨 리스너: 이벤트가 어디서든 잡히도록 (근본 해결)
  useEffect(() => {
    const handleDocClick = (e: Event) => {
      const el = e.target as HTMLElement
      const target = el.closest('[data-result-action]')
      const isDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1')
      if (isDebug) {
        console.log('[Result 클릭]', {
          tag: el.tagName,
          id: el.id,
          className: el.className?.slice(0, 80),
          dataAction: target?.getAttribute('data-result-action') ?? '(없음)',
        })
      }
      if (!target) return
      const action = target.getAttribute('data-result-action')
      if (!action) return
      e.preventDefault()
      e.stopPropagation()
      const now = Date.now()
      if (lastActionRef.current.name === action && now - lastActionRef.current.time < 500) return
      lastActionRef.current = { name: action, time: now }
      const h = handlersRef.current
      if (!h) return
      if (action === 'test') {
        try {
          if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert('클릭됨!')
          else alert('클릭됨!')
        } catch {
          alert('클릭됨!')
        }
        return
      }
      if (action === 'visualize') h.visualize()
      else if (action === 'report') h.report()
      else if (action === 'share') h.share()
      else if (action === 'save') h.save()
      else if (action === 'unlock') h.unlock()
    }
    document.addEventListener('click', handleDocClick, true)
    document.addEventListener('pointerdown', handleDocClick, true)
    return () => {
      document.removeEventListener('click', handleDocClick, true)
      document.removeEventListener('pointerdown', handleDocClick, true)
    }
  }, [])

  // 테스트 바: body에 포털로 렌더 → 레이아웃/캐시와 무관하게 항상 최상단에 표시
  const testBar = (
    <div
      id="result-test-bar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderBottom: '3px solid #b45309',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        touchAction: 'manipulation',
      }}
    >
      <button
        type="button"
        data-result-action="test"
        className="result-action-btn w-full py-3 text-black font-bold rounded-lg border-0 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.95)' }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          try {
            if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert('클릭됨!')
            else alert('클릭됨!')
          } catch {
            alert('클릭됨!')
          }
        }}
      >
        🔧 테스트: 여기 눌러보세요 (클릭되면 알림)
      </button>
    </div>
  )

  return (
    <>
      {typeof document !== 'undefined' && createPortal(testBar, document.body)}
      <div className="min-h-screen bg-gradient-midnight p-6" style={{ paddingTop: 72 }}>
        <div
          ref={containerRef}
          className="max-w-2xl mx-auto"
          onClick={handleDelegatedAction}
          onPointerDown={handleDelegatedAction}
          role="presentation"
        >
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
            {(dreamResult.symbols || []).map((symbol, idx) => (
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
                        type="button"
                        data-result-action="unlock"
                        onClick={handleUnlock}
                        className="btn-primary z-10 result-action-btn"
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
              {(dreamResult.advice || []).map((item, idx) => (
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

        {/* Upsell + Referral: ensure above overlays and tappable in Telegram */}
        <div className="relative z-10 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            data-result-action="visualize"
            className="result-action-btn card cursor-pointer hover:shadow-moonlight transition-all text-left w-full border-0 touch-manipulation active:opacity-90 min-h-[56px] select-none"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVisualize() }}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {t('result.upsell.visualize.title')}
            </h3>
            <p className="text-text-secondary mb-4">
              {t('result.upsell.visualize.description')}
            </p>
            <div className="text-indigo-light font-semibold">
              {t('result.upsell.visualize.price')}
            </div>
          </button>

          <button
            type="button"
            data-result-action="report"
            className="result-action-btn card cursor-pointer hover:shadow-moonlight transition-all text-left w-full border-0 touch-manipulation active:opacity-90 min-h-[56px] select-none"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReport() }}
          >
            <h3 className="text-xl font-bold text-white mb-2">
              {t('result.upsell.report.title')}
            </h3>
            <p className="text-text-secondary mb-4">
              {t('result.upsell.report.description')}
            </p>
            <div className="text-indigo-light font-semibold">
              {t('result.upsell.report.price')}
            </div>
          </button>
        </div>

        {/* Referral System */}
        <ReferralSystem />

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button type="button" data-result-action="share" onClick={(e) => { e.stopPropagation(); handleShare() }} className="btn-primary flex-1 min-h-[48px] result-action-btn">
            {t('result.share')}
          </button>
          <button type="button" data-result-action="save" onClick={(e) => { e.stopPropagation(); handleSave() }} className="btn-primary flex-1 min-h-[48px] result-action-btn">
            {t('result.save')}
          </button>
        </div>

        {/* Cross Promotion */}
        <div className="text-center text-text-secondary text-sm">
          {t('result.crossPromo')}
        </div>
        </div>
      </div>
    </div>
    </>
  )
}
