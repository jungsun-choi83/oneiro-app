import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'

export default function ReferralSystem() {
  const { t } = useTranslation()
  const [referralCount, setReferralCount] = useState(0)
  const [referralCode, setReferralCode] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)

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

  const handleCopyLink = () => {
    const referralLink = `https://t.me/ONEIROBot?start=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    window.Telegram?.WebApp?.showAlert?.('Referral link copied!')
  }

  const handleShare = () => {
    const referralLink = `https://t.me/ONEIROBot?start=${referralCode}`
    const shareText = `🔮 Discover what your dreams are telling you! Use my referral code to unlock free dream interpretations: ${referralLink}`
    
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(
        `https://t.me/share/url?url=${encodeURIComponent(shareText)}`
      )
    }
  }

  return (
    <div className="card mb-6 bg-gradient-to-br from-indigo/20 to-purple/20 border-indigo/50">
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
            <div className="text-xs text-text-secondary mb-1">Your Referral Code</div>
            <div className="text-white font-mono font-semibold">{referralCode}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 btn-primary text-sm py-2"
          >
            {t('referral.copy', { defaultValue: 'Copy Link' })}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 btn-primary text-sm py-2"
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
