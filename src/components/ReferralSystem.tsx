import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'

export default function ReferralSystem() {
  const { t } = useTranslation()
  const [referralCount, setReferralCount] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const lastRefAction = useRef<{ name: string; time: number }>({ name: '', time: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const handlersRef = useRef<{ copy: () => void; share: () => void }>(null as any)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    const telegramUserId = getTelegramUserId()
    if (!telegramUserId) {
      // Generate local referral code
      const localCode = `ONEIRO-${telegramUserId || Date.now().toString().slice(-6)}`
      setReferralCode(localCode)
      const savedCount = localStorage.getItem(`referral_count_${localCode}`)
      setReferralCount(savedCount ? parseInt(savedCount) : 0)
      setIsUnlocked(parseInt(savedCount || '0') >= 3)
      return
    }

    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
      const localCode = `ONEIRO-${telegramUserId}`
      setReferralCode(localCode)
      const savedCount = localStorage.getItem(`referral_count_${localCode}`)
      setReferralCount(savedCount ? parseInt(savedCount) : 0)
      setIsUnlocked(parseInt(savedCount || '0') >= 3)
      return
    }

    try {
      // Get or create referral code
      const { data: user } = await supabase
        .from('dream_users')
        .select('referral_code, referral_count, free_credits_earned')
        .eq('telegram_id', telegramUserId)
        .single()

      if (user) {
        const code = user.referral_code || `ONEIRO-${telegramUserId}`
        setReferralCode(code)
        setReferralCount(user.referral_count || 0)
        setIsUnlocked(user.free_credits_earned > 0)
      } else {
        const code = `ONEIRO-${telegramUserId}`
        setReferralCode(code)
        setReferralCount(0)
      }
    } catch (err) {
      console.error('Error loading referral data:', err)
      const code = `ONEIRO-${telegramUserId}`
      setReferralCode(code)
      setReferralCount(0)
    }
  }

  const showMsg = (msg: string) => {
    try {
      if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(msg)
      else alert(msg)
    } catch {
      alert(msg)
    }
  }

  const handleCopyLink = () => {
    try {
      const referralLink = `https://t.me/ONEIRO83Bot?start=${referralCode}`
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(referralLink).then(() => {
          showMsg(t('referral.copied', { defaultValue: '초대 링크가 복사되었습니다!' }))
        }).catch(() => {
          showMsg(t('referral.copyHint', { defaultValue: '초대 링크가 복사되지 않았습니다. 위 코드를 수동으로 공유해 주세요.' }))
        })
      } else {
        showMsg(referralLink)
      }
    } catch (e) {
      console.error('Copy link error:', e)
      showMsg(t('referral.copyHint', { defaultValue: '초대 링크가 복사되지 않았습니다. 위 코드를 수동으로 공유해 주세요.' }))
    }
  }

  const handleShare = () => {
    const referralLink = `https://t.me/ONEIRO83Bot?start=${referralCode}`
    const shareText = `🔮 꿈이 전하는 메시지를 발견해 보세요! 내 초대 링크로 무료 해몽을 받아가세요: ${referralLink}`
    
    try {
      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(
          `https://t.me/share/url?url=${encodeURIComponent(shareText)}`
        )
      } else {
        navigator.clipboard.writeText(shareText).then(() => {
          showMsg(t('referral.copied', { defaultValue: '공유 문구가 복사되었습니다. 텔레그램 등에 붙여넣기 하세요.' }))
        }).catch(() => showMsg(shareText))
      }
    } catch {
      navigator.clipboard.writeText(shareText).then(() => {
        showMsg(t('referral.copied', { defaultValue: '공유 문구가 복사되었습니다. 텔레그램 등에 붙여넣기 하세요.' }))
      }).catch(() => showMsg(shareText))
    }
  }

  const handleDelegatedReferral = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest('[data-referral-action]')
    if (!el) return
    const action = el.getAttribute('data-referral-action')
    if (!action) return
    const now = Date.now()
    if (lastRefAction.current.name === action && now - lastRefAction.current.time < 500) return
    lastRefAction.current = { name: action, time: now }
    e.preventDefault()
    e.stopPropagation()
    if (action === 'copy') handleCopyLink()
    else if (action === 'share') handleShare()
  }

  handlersRef.current = { copy: handleCopyLink, share: handleShare }

  useEffect(() => {
    const handleDocClick = (e: Event) => {
      const target = (e.target as HTMLElement).closest('[data-referral-action]')
      if (!target) return
      const action = target.getAttribute('data-referral-action')
      if (!action) return
      e.preventDefault()
      e.stopPropagation()
      const now = Date.now()
      if (lastRefAction.current.name === action && now - lastRefAction.current.time < 500) return
      lastRefAction.current = { name: action, time: now }
      const h = handlersRef.current
      if (h && action === 'copy') h.copy()
      else if (h && action === 'share') h.share()
    }
    document.addEventListener('click', handleDocClick, true)
    document.addEventListener('pointerdown', handleDocClick, true)
    return () => {
      document.removeEventListener('click', handleDocClick, true)
      document.removeEventListener('pointerdown', handleDocClick, true)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="card mb-6 bg-gradient-to-br from-indigo/20 to-purple/20 border-indigo/50 relative z-10"
      onClick={handleDelegatedReferral}
      onPointerDown={handleDelegatedReferral}
      role="presentation"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            🎁 {t('referral.title', { defaultValue: 'Get Free Credits' })}
          </h3>
          <p className="text-text-secondary text-sm">
            {t('referral.description', { defaultValue: 'Invite 3 friends to unlock a free Full Reading!' })}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-secondary/50 rounded-lg p-3 border border-tertiary">
            <div className="text-xs text-text-secondary mb-1">{t('referral.yourCode', { defaultValue: 'Your Referral Code' })}</div>
            <div className="text-white font-mono font-semibold">{referralCode}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            data-referral-action="copy"
            onClick={(e) => { e.stopPropagation(); handleCopyLink() }}
            className="flex-1 btn-primary text-sm py-2 touch-manipulation min-h-[44px] referral-action-btn"
          >
            {t('referral.copy', { defaultValue: 'Copy Link' })}
          </button>
          <button
            type="button"
            data-referral-action="share"
            onClick={(e) => { e.stopPropagation(); handleShare() }}
            className="flex-1 btn-primary text-sm py-2 touch-manipulation min-h-[44px] referral-action-btn"
          >
            {t('referral.share', { defaultValue: 'Share' })}
          </button>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-lg p-4 border border-indigo/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-text-secondary text-sm">
            {t('referral.progress', { defaultValue: 'Invited Friends' })}
          </span>
          <span className="text-indigo-light font-bold">
            {referralCount}/3
          </span>
        </div>
        <div className="w-full bg-tertiary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-indigo transition-all duration-300 rounded-full"
            style={{ width: `${Math.min((referralCount / 3) * 100, 100)}%` }}
          />
        </div>
        {isUnlocked && (
          <div className="mt-3 text-center">
            <span className="text-green-400 font-semibold">
              ✓ {t('referral.unlocked', { defaultValue: 'Free credit unlocked! Use it now.' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
