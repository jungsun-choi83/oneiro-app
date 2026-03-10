import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const { dreamResult, dreamText, mood, isRecurring, addToJournal, userProfile, usedMockData } = useDreamStore()
  // 미리보기 모드 감지: URL 파라미터가 최우선
  const isPreviewMode = searchParams.get('preview') === '1'
  const hasPreviewInUrl = typeof window !== 'undefined' && window.location.search.includes('preview=1')
  
  // 실제 텔레그램 사용자인지 확인: initDataUnsafe.user.id가 있어야 진짜 텔레그램 사용자
  // 브라우저에서도 telegram-web-app.js가 로드되면 window.Telegram이 있지만, user.id는 없음
  const hasRealTelegramUser = typeof window !== 'undefined' && 
    !!(window.Telegram?.WebApp?.initDataUnsafe?.user?.id)
  // 텔레그램 앱에서 열었는지: 유효한 user ID(양수)가 있으면 앱에서 연 것
  const telegramUserId = typeof window !== 'undefined' ? getTelegramUserId() : null
  const isInTelegramApp = telegramUserId != null && telegramUserId > 0

  // URL에 preview=1이 있으면 무조건 미리보기 모드
  // 없으면 브라우저에서 열었을 때만 미리보기 (텔레그램 사용자가 아닐 때)
  const showPreview = isPreviewMode || hasPreviewInUrl || (typeof window !== 'undefined' && !hasRealTelegramUser && !window.Telegram?.WebApp?.initDataUnsafe?.user)
  // 테스트/디버그 박스: 텔레그램 앱에서는 절대 숨김. 브라우저에서만 URL에 debug=1일 때 표시
  const showDebugPanel = !isInTelegramApp && typeof window !== 'undefined' && window.location.search.includes('debug=1')
  
  // 디버깅용 로그 (즉시 출력 - useEffect 전에)
  if (typeof window !== 'undefined') {
    const isBrowserCheck = !hasRealTelegramUser && !window.Telegram?.WebApp?.initDataUnsafe?.user
    console.log('🔍 [ONEIRO Result] ========== Result 페이지 로드 ==========')
    console.log('🔍 [ONEIRO Result] Preview Mode Check:', {
      showPreview,
      isPreviewMode,
      hasPreviewInUrl,
      isBrowser: isBrowserCheck,
      hasRealTelegramUser,
      telegramUserId: getTelegramUserId(),
      hasTelegramObject: !!window.Telegram,
      hasWebApp: !!window.Telegram?.WebApp,
      hasUser: !!window.Telegram?.WebApp?.initDataUnsafe?.user,
      url: window.location.href,
      search: window.location.search,
      usedMockData: usedMockData,
      hasDreamResult: !!dreamResult
    })
    // 미리보기 모드면 더 눈에 띄게 표시
    if (showPreview) {
      console.log('✅ [ONEIRO] 미리보기 모드 활성화됨! showPreview =', showPreview)
    } else {
      console.warn('⚠️ [ONEIRO] 미리보기 모드 비활성화됨. showPreview =', showPreview)
    }
    if (usedMockData) {
      console.error('❌ [ONEIRO] ========== Mock 데이터 사용 중! ==========')
      console.error('❌ [ONEIRO] 같은 해석이 나오는 이유: Mock 데이터를 사용하고 있습니다.')
      console.error('❌ [ONEIRO] 해결 방법: Vercel에 환경 변수를 설정하고 재배포하세요.')
      console.error('❌ [ONEIRO] ==========================================')
    } else if (dreamResult) {
      console.log('✅ [ONEIRO] 실제 API 데이터 사용 중 - 꿈마다 다른 해석이 나옵니다!')
    }
    console.log('🔍 [ONEIRO Result] ==========================================')
  }
  const [unlocked, setUnlocked] = useState(fullReading || userProfile?.freeReadingsUsed === 0 || showPreview)
  const [showBlur, setShowBlur] = useState(false) // 미리보기 모드에서는 항상 잠금 해제
  const [hydrated, setHydrated] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const lastActionRef = useRef<{ name: string; time: number }>({ name: '', time: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const handlersRef = useRef<{
    visualize: () => void
    report: () => void
    share: () => void
    save: () => void
    unlock: () => void
  }>(null as any)

  /** Telegram may send "Paid" (capital P) or "paid"; Stars sometimes reports failed despite success. */
  const isPaymentSuccess = (status: string) => (status?.toLowerCase() === 'paid')
  const isPaymentFailedOrCancelled = (status: string) => {
    const s = status?.toLowerCase()
    return s === 'failed' || s === 'cancelled'
  }

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    // 미리보기 모드가 아닐 때만 리다이렉트
    if (hydrated && !dreamResult && !showPreview) {
      navigate('/dream')
    }
  }, [hydrated, dreamResult, navigate, showPreview])

  // 미리보기 모드에서 dreamResult가 없으면 mock 데이터 사용
  const previewMockResult = {
    essence: "당신의 꿈은 표현을 갈구하는 숨겨진 감정을 드러냅니다.",
    hiddenMeaning: "당신의 무의식이 숨기고 있는 거대한 신호가 발견되었습니다. 이 꿈은 단순한 기억이 아니라 당신의 운명을 바꿀 바다의 변혁적 힘을 품고 있습니다.",
    symbols: [
      { emoji: "🌊", name: "바다", meaning: "깊은 감정과 무의식" },
      { emoji: "🦋", name: "나비", meaning: "변화와 변형" },
      { emoji: "🌙", name: "달", meaning: "직관과 여성적 에너지" }
    ],
    deepInsight: "당신의 꿈은 무의식의 세계로 열리는 창입니다. 꿈속 상징들은 인정을 갈구하는 내면의 측면을 나타냅니다. 바다는 감정의 깊이를, 나비는 변형의 시기를, 달은 직관이 이 변화를 이끌고 있음을 말해줍니다.",
    psychologicalShadow: "융의 관점에서, 꿈속 바다는 억압된 감정과 원형이 머무는 무의식의 영역을 상징합니다.",
    easternProphecy: "동양 해몽에서 물(海)은 지혜와 감정의 흐름을 나타냅니다.",
    spiritualAdvice: "물가에서 명상하거나 고요한 바다를 상상해 보세요. 30일간 꿈 일기를 써 보세요.",
    advice: ["오늘 하루 자기 성찰 시간을 가지세요", "결정할 때 직관을 믿으세요", "창작 활동으로 감정을 표현해 보세요"],
    emotionalTone: "명상적",
    spiritualMessage: "영혼이 이 상징들을 통해 말하고 있습니다. 전해지는 메시지를 믿고 성장을 받아들이세요."
  }

  // 미리보기 모드이거나 dreamResult가 없으면 mock 사용
  const displayResult = dreamResult || (showPreview ? previewMockResult : null)

  // Hidden Meaning이 mock과 정확히 일치하면 API 실패로 간주 (같은 해석 문제)
  const MOCK_HIDDEN_MEANING_EN = "Your unconscious mind has been hiding a massive signal. This dream is not just a memory, but carries the transformative power of the ocean that could change your destiny."
  const MOCK_HIDDEN_MEANING_KO = "당신의 무의식이 숨기고 있는 거대한 신호가 발견되었습니다. 이 꿈은 단순한 기억이 아니라 당신의 운명을 바꿀 바다의 변혁적 힘을 품고 있습니다."
  const isDisplayingMockContent = displayResult && (
    displayResult.hiddenMeaning === MOCK_HIDDEN_MEANING_EN ||
    displayResult.hiddenMeaning === MOCK_HIDDEN_MEANING_KO
  )
  const effectiveUsingMock = usedMockData || !!isDisplayingMockContent

  // 미리보기 모드가 아니고 dreamResult도 없으면 로딩 또는 리다이렉트
  // 단, 미리보기 모드면 미리보기 바를 보여주기 위해 계속 진행
  if (!displayResult && !showPreview) {
    if (!hydrated) {
      return (
        <div className="min-h-screen bg-gradient-midnight flex items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      )
    }
    // 미리보기 모드가 아닐 때만 리다이렉트
    return null
  }

  const showMsg = (msg: string) => {
    // 미리보기 모드에서는 메시지 표시 안 함
    if (showPreview) {
      console.log('[Result] Preview mode - message suppressed:', msg)
      return
    }
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
    setPaymentError(null) // 에러 초기화
    if (showPreview) {
      setUnlocked(true)
      setShowBlur(false)
      return
    }
    if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
      setUnlocked(true)
      setShowBlur(false)
      return
    }
    if (document.querySelector('[data-preview="true"]')) {
      setUnlocked(true)
      setShowBlur(false)
      return
    }
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
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Creating invoice for full_reading, telegramUserId:', telegramUserId)
      }
      
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'full_reading',
          telegramUserId,
        },
      })

      if (error) {
        console.error('[ONEIRO] create-invoice error:', error)
        throw error
      }
      
      if (!data?.invoice_url) {
        console.error('[ONEIRO] No invoice_url in response:', data)
        throw new Error(data?.error || 'Invoice creation failed')
      }
      
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Invoice created:', data.invoice_url)
      }

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            console.log('[ONEIRO] Payment status:', status)
            if (isPaymentSuccess(status)) {
              setUnlocked(true)
              setShowBlur(false)
              if (userProfile) {
                useDreamStore.getState().setUserProfile({
                  ...userProfile,
                  freeReadingsUsed: userProfile.freeReadingsUsed + 1,
                })
              }
              showMsg('결제가 완료되었습니다! 전체 해몽을 확인하세요.')
            } else if (isPaymentFailedOrCancelled(status)) {
              console.warn('[ONEIRO] Payment failed or cancelled:', status)
              showMsg('결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.')
            } else {
              console.log('[ONEIRO] Payment status (other):', status)
            }
          })
        } else {
          console.warn('[ONEIRO] openInvoice not available')
          showMsg('결제 기능을 사용할 수 없습니다. 텔레그램 앱 최신 버전으로 업데이트하거나 봇 메뉴에서 앱을 다시 열어주세요.')
        }
      } catch (e) {
        console.error('[ONEIRO] Payment error:', e)
        const errorMsg = e instanceof Error ? e.message : String(e)
        if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
          showMsg('결제 기능이 지원되지 않는 버전입니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.')
        } else {
          showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 이용해 주세요.')
        }
      }
    } catch (err) {
      console.error('[ONEIRO] Payment error:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      const errorData = (err as { context?: { body?: any } })?.context?.body
      
      let errorMessage = ''
      if (errorData?.error_code === 400 || errorMsg.includes('Bad Request')) {
        errorMessage = '결제 요청이 잘못되었습니다. 봇이 Stars 결제를 지원하도록 설정되어 있는지 확인해 주세요.'
      } else if (errorData?.error_code === 401 || errorMsg.includes('Unauthorized')) {
        errorMessage = '봇 토큰이 잘못되었습니다. Supabase Edge Function에 TELEGRAM_BOT_TOKEN을 확인해 주세요.'
      } else if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
        errorMessage = '결제 기능이 지원되지 않습니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.'
      } else {
        errorMessage = `결제 준비에 실패했습니다: ${errorData?.error || errorMsg}. 잠시 후 다시 시도해 주세요.`
      }
      
      setPaymentError(errorMessage)
      showMsg(errorMessage)
    }
  }

  const handleVisualize = async () => {
    if (showPreview) {
      navigate('/visualize?preview=1')
      return
    }
    if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
      navigate('/visualize?preview=1')
      return
    }
    if (document.querySelector('[data-preview="true"]')) {
      navigate('/visualize?preview=1')
      return
    }
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      showMsg(openInTelegramMsg)
      return
    }

    try {
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Creating invoice for dream_visualizer, telegramUserId:', telegramUserId)
      }
      
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'dream_visualizer',
          telegramUserId,
        },
      })

      if (error) {
        console.error('[ONEIRO] create-invoice error:', error)
        throw error
      }
      
      if (!data?.invoice_url) {
        console.error('[ONEIRO] No invoice_url in response:', data)
        throw new Error(data?.error || 'Invoice creation failed')
      }
      
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Invoice created:', data.invoice_url)
      }

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            console.log('[ONEIRO] Payment status:', status)
            if (isPaymentSuccess(status)) {
              navigate('/visualize')
            } else if (isPaymentFailedOrCancelled(status)) {
              console.warn('[ONEIRO] Payment failed or cancelled:', status)
              showMsg('결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.')
            } else {
              console.log('[ONEIRO] Payment status (other):', status)
            }
          })
        } else {
          console.warn('[ONEIRO] openInvoice not available')
          showMsg('결제 기능을 사용할 수 없습니다. 텔레그램 앱 최신 버전으로 업데이트하거나 봇 메뉴에서 앱을 다시 열어주세요.')
        }
      } catch (e) {
        console.error('[ONEIRO] Payment error:', e)
        const errorMsg = e instanceof Error ? e.message : String(e)
        if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
          showMsg('결제 기능이 지원되지 않는 버전입니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.')
        } else {
          showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 주세요.')
        }
      }
    } catch (err) {
      console.error('[ONEIRO] Payment error:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      const errorData = (err as { context?: { body?: any } })?.context?.body
      
      if (errorData?.error_code === 400 || errorMsg.includes('Bad Request')) {
        showMsg('결제 요청이 잘못되었습니다. 봇이 Stars 결제를 지원하도록 설정되어 있는지 확인해 주세요.')
      } else if (errorData?.error_code === 401 || errorMsg.includes('Unauthorized')) {
        showMsg('봇 토큰이 잘못되었습니다. Supabase Edge Function에 TELEGRAM_BOT_TOKEN을 확인해 주세요.')
      } else if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
        showMsg('결제 기능이 지원되지 않습니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.')
      } else {
        showMsg(`결제 준비에 실패했습니다: ${errorData?.error || errorMsg}. 잠시 후 다시 시도해 주세요.`)
      }
    }
  }

  const handleReport = async () => {
    if (showPreview) {
      navigate('/report?preview=1')
      return
    }
    if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
      navigate('/report?preview=1')
      return
    }
    if (document.querySelector('[data-preview="true"]')) {
      navigate('/report?preview=1')
      return
    }
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      showMsg(openInTelegramMsg)
      return
    }

    try {
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Creating invoice for soul_report, telegramUserId:', telegramUserId)
      }
      
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          product: 'soul_report',
          telegramUserId,
        },
      })

      if (error) {
        console.error('[ONEIRO] create-invoice error:', error)
        throw error
      }
      
      if (!data?.invoice_url) {
        console.error('[ONEIRO] No invoice_url in response:', data)
        throw new Error(data?.error || 'Invoice creation failed')
      }
      
      if (typeof window !== 'undefined') {
        console.log('[ONEIRO] Invoice created:', data.invoice_url)
      }

      try {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoice_url, (status) => {
            console.log('[ONEIRO] Payment status:', status)
            if (isPaymentSuccess(status)) {
              navigate('/report')
            } else if (isPaymentFailedOrCancelled(status)) {
              console.warn('[ONEIRO] Payment failed or cancelled:', status)
              showMsg('결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.')
            } else {
              console.log('[ONEIRO] Payment status (other):', status)
            }
          })
        } else {
          console.warn('[ONEIRO] openInvoice not available')
          showMsg('결제 기능을 사용할 수 없습니다. 텔레그램 앱 최신 버전으로 업데이트하거나 봇 메뉴에서 앱을 다시 열어주세요.')
        }
      } catch (e) {
        console.error('[ONEIRO] Payment error:', e)
        const errorMsg = e instanceof Error ? e.message : String(e)
        if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
          showMsg('결제 기능이 지원되지 않는 버전입니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.')
        } else {
          showMsg('결제 창을 열 수 없습니다. 텔레그램 앱에서 봇을 열어 주세요.')
        }
      }
    } catch (err) {
      console.error('[ONEIRO] Payment error:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)
      const errorData = (err as { context?: { body?: any } })?.context?.body
      
      if (errorData?.error_code === 400 || errorMsg.includes('Bad Request')) {
        showMsg('결제 요청이 잘못되었습니다. 봇이 Stars 결제를 지원하도록 설정되어 있는지 확인해 주세요.')
      } else if (errorData?.error_code === 401 || errorMsg.includes('Unauthorized')) {
        showMsg('봇 토큰이 잘못되었습니다. Supabase Edge Function에 TELEGRAM_BOT_TOKEN을 확인해 주세요.')
      } else if (errorMsg.includes('PAYMENT_UNSUPPORTED') || errorMsg.includes('not supported')) {
        showMsg('결제 기능이 지원되지 않습니다. 텔레그램 앱을 최신 버전으로 업데이트해 주세요.')
      } else {
        showMsg(`결제 준비에 실패했습니다: ${errorData?.error || errorMsg}. 잠시 후 다시 시도해 주세요.`)
      }
    }
  }

  const handleShare = () => {
    if (!displayResult) return
    const shareText = `🔮 My dream holds a secret message... Check your own destiny with AI Dream Guide ONEIRO! 🌙\n\n${displayResult.hiddenMeaning || displayResult.essence}\n\nDiscover what your dreams are telling you: https://t.me/ONEIRO83Bot`
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
    if (!displayResult || !dreamResult) return // 실제 dreamResult만 저장 가능
    try {
      addToJournal({
        id: Date.now().toString(),
        dreamText: dreamText || '미리보기',
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
  const insightSentences = displayResult?.deepInsight ? displayResult.deepInsight.split(/[.!?]+/).filter(s => s.trim()) : []
  const visibleText = unlocked 
    ? (displayResult?.psychologicalShadow && displayResult?.easternProphecy && displayResult?.spiritualAdvice 
        ? displayResult?.deepInsight ?? '' 
        : displayResult?.deepInsight ?? '')
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

  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
        <div
          ref={containerRef}
          className="max-w-2xl mx-auto"
          {...(showPreview ? { 'data-preview': 'true' } : {})}
          onClick={handleDelegatedAction}
          onPointerDown={handleDelegatedAction}
          role="presentation"
        >
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* 미리보기/디버그: showPreview 또는 URL에 debug=1일 때만 표시 */}
        {showDebugPanel && (
        <div className="mb-4 p-4 rounded-xl border-2 border-amber-400 bg-amber-500/20 shadow-lg z-50 relative" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
          <p className="text-amber-100 font-bold text-lg mb-2">
            🔧 테스트 모드 {showPreview ? '✅ 활성화됨' : '❌ 비활성화됨'}
          </p>
          
          {/* 디버그 정보: API 호출 상태 */}
          <div className="mb-3 p-3 bg-black/30 rounded-lg">
            <p className="text-amber-200 font-semibold text-sm mb-2">📊 API 호출 상태:</p>
            <div className="text-amber-200/90 text-xs font-mono space-y-1">
              <div>• Mock 데이터 사용: {effectiveUsingMock ? '❌ 예 (같은 해석)' : '✅ 아니오 (다른 해석)'}</div>
              <div>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}</div>
              <div>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}</div>
              <div>• 텔레그램 사용자 ID: {getTelegramUserId() || '없음 (브라우저 모드)'}</div>
            </div>
            {effectiveUsingMock && (
              <p className="text-red-300 text-xs mt-2 font-semibold">
                ⚠️ Mock 데이터 사용 중 — Hidden Meaning이 항상 같은 이유입니다. Supabase Edge Function에 OPENAI_API_KEY를 설정하고, 텔레그램 앱에서 네트워크 연결을 확인해 주세요.
              </p>
            )}
          </div>
          
          {/* 디버그 정보: 결제 상태 */}
          <div className="mb-3 p-3 bg-black/30 rounded-lg">
            <p className="text-amber-200 font-semibold text-sm mb-2">💳 결제 상태:</p>
            <div className="text-amber-200/90 text-xs font-mono space-y-1">
              <div>• 텔레그램 WebApp: {typeof window !== 'undefined' && window.Telegram?.WebApp ? '✅ 있음' : '❌ 없음'}</div>
              <div>• openInvoice 함수: {typeof window !== 'undefined' && window.Telegram?.WebApp?.openInvoice ? '✅ 있음' : '❌ 없음'}</div>
              <div>• 실제 텔레그램 사용자: {hasRealTelegramUser ? '✅ 예' : '❌ 아니오 (브라우저)'}</div>
            </div>
            {!hasRealTelegramUser && (
              <p className="text-yellow-300 text-xs mt-2">
                💡 결제는 텔레그램 앱에서만 가능합니다. 봇 메뉴에서 앱을 열어주세요.
              </p>
            )}
            {paymentError && (
              <div className="mt-2 p-2 bg-red-500/20 border border-red-400 rounded">
                <p className="text-red-300 text-xs font-semibold">❌ 결제 에러:</p>
                <p className="text-red-200 text-xs mt-1">{paymentError}</p>
              </div>
            )}
          </div>
          
          <p className="text-amber-200/90 text-xs mb-2 font-mono break-all">
            [DEBUG] showPreview={String(showPreview)}, isPreviewMode={String(isPreviewMode)}, 
            hasPreviewInUrl={String(hasPreviewInUrl)}, hasRealTelegramUser={String(hasRealTelegramUser)}, 
            url={typeof window !== 'undefined' ? window.location.search : 'N/A'}
          </p>
          {showPreview && (
            <>
              <p className="text-amber-200/90 text-sm mb-3">
                결제 없이 모든 기능을 테스트할 수 있습니다. 아래 버튼 또는 하단 카드(꿈 시각화/리포트)를 눌러 바로 확인하세요.
              </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-5 py-3 rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-300 shadow-md transition-all"
                onClick={() => {
                  setUnlocked(true)
                  setShowBlur(false)
                }}
              >
                🔓 전체 해몽 잠금 해제 (테스트)
              </button>
              <button
                type="button"
                className="px-5 py-3 rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-300 shadow-md transition-all"
                onClick={() => navigate('/report?preview=1')}
              >
                📜 결과지(리포트) 보기
              </button>
              <button
                type="button"
                className="px-5 py-3 rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-300 shadow-md transition-all"
                onClick={() => navigate('/visualize?preview=1')}
              >
                🖼️ 꿈 시각화 화면 보기
              </button>
            </div>
            </>
          )}
          {!showPreview && !hasRealTelegramUser && (
            <p className="text-amber-200/90 text-sm">
              ⚠️ 미리보기 모드가 비활성화되어 있습니다. URL에 ?preview=1을 추가하거나 브라우저에서 직접 열어주세요.
            </p>
          )}
        </div>
        )}

        {/* 해몽 내용 표시 (displayResult가 있을 때만) */}
        {displayResult && (
          <>
        {/* The Hidden Meaning - Cliffhanger Style */}
        <div className="card mb-6 bg-gradient-to-br from-indigo/20 to-purple/20 border-indigo/50">
          <h2 className="text-sm font-semibold text-indigo-light mb-2 uppercase tracking-wide">
            {t('result.hiddenMeaning', { defaultValue: 'The Hidden Meaning' })}
          </h2>
          <p className="text-xl font-title font-bold text-white leading-relaxed">
            {displayResult.hiddenMeaning || displayResult.essence}
          </p>
        </div>

        {/* The Essence */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-indigo-light mb-2 uppercase tracking-wide">
            {t('result.essence')}
          </h2>
          <p className="text-lg font-title text-white">
            {displayResult.essence}
          </p>
        </div>

        {/* Key Symbols */}
        <div className="card mb-6">
          <h2 className="text-sm font-semibold text-indigo-light mb-4 uppercase tracking-wide">
            {t('result.symbols')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {(displayResult.symbols || []).map((symbol, idx) => (
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
            {unlocked && displayResult.psychologicalShadow && displayResult.easternProphecy && displayResult.spiritualAdvice ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">1)</span> Psychological Shadow
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {displayResult.psychologicalShadow}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">2)</span> Eastern Prophecy
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {displayResult.easternProphecy}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-indigo-light">3)</span> Spiritual Advice
                  </h3>
                  <p className="text-text-primary leading-relaxed whitespace-pre-wrap">
                    {displayResult.spiritualAdvice}
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
              {(displayResult.advice || []).map((item, idx) => (
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
              {displayResult.spiritualMessage}
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
          </>
        )}

        </div>
      </div>
  )
}
