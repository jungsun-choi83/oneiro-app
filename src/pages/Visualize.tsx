import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'

const WATERMARK_TEXT = '✦ ONEIRO / @ONEIRO83Bot'
const BOT_LINK = 'https://t.me/ONEIRO83Bot'

function drawWatermark(canvas: HTMLCanvasElement, imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = img.naturalWidth * dpr
      canvas.height = img.naturalHeight * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No canvas context'))
        return
      }
      ctx.scale(dpr, dpr)
      ctx.drawImage(img, 0, 0)
      const w = img.naturalWidth
      const h = img.naturalHeight
      const pad = 16
      const fontSize = Math.max(12, Math.min(14, w / 32))
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
      const textWidth = ctx.measureText(WATERMARK_TEXT).width
      const pillW = textWidth + 24
      const pillH = 28
      const x = w - pillW - pad
      const y = h - pillH - pad
      const r = pillH / 2
      ctx.beginPath()
      ctx.roundRect(x, y, pillW, pillH, r)
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(WATERMARK_TEXT, x + pillW / 2, y + pillH / 2)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

export default function Visualize() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamText, dreamResult, dreamImage, artTitle, setDreamImage, setArtTitle } = useDreamStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [watermarkedDataUrl, setWatermarkedDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const generateImage = async () => {
      if (dreamImage) {
        setLoading(false)
        return
      }
      if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
        setLoading(false)
        setPreviewMode(true)
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
        if (!data?.imageUrl) throw new Error('No image in response')

        setDreamImage(data.imageUrl)
        setArtTitle(data.artTitle ?? '')
        setLoading(false)
      } catch (err) {
        console.error('Error generating image:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    generateImage()
  }, [dreamText, dreamResult, dreamImage, setDreamImage, setArtTitle])

  useEffect(() => {
    if (!dreamImage) {
      setWatermarkedDataUrl(null)
      return
    }
    const canvas = document.createElement('canvas')
    drawWatermark(canvas, dreamImage)
      .then(setWatermarkedDataUrl)
      .catch(() => setWatermarkedDataUrl(dreamImage))
  }, [dreamImage])

  const displayImageUrl = watermarkedDataUrl || dreamImage
  const showPreviewPlaceholder = previewMode && !dreamImage

  const handleSave = () => {
    if (displayImageUrl) {
      const link = document.createElement('a')
      link.href = displayImageUrl
      link.download = `${artTitle || 'dream-art'}.png`
      link.click()
    }
  }

  const handleShareToStory = () => {
    const urlToShare = displayImageUrl || dreamImage
    if (!urlToShare) return
    try {
      if (typeof window.Telegram?.WebApp?.shareToStory === 'function') {
        window.Telegram.WebApp.shareToStory(urlToShare, {
          widget_link: { url: BOT_LINK, name: 'Interpret My Dream' },
        })
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Shared successfully! 🌌')
        }
      } else if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(urlToShare)
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert('Shared successfully! 🌌')
        }
      } else {
        window.open(urlToShare, '_blank')
      }
    } catch {
      if (urlToShare) window.open(urlToShare, '_blank')
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
            <div className="aspect-square w-full max-w-md mx-auto rounded-lg border border-indigo/30 bg-indigo/10 overflow-hidden mb-6">
              <div className="w-full h-full animate-pulse bg-gradient-to-br from-indigo/30 via-purple/20 to-indigo/30" />
            </div>
            <div className="text-5xl mb-4 animate-pulse opacity-80">🌙 ✦</div>
            <p className="text-xl text-white/90 mb-2">{t('visualize.loading')}</p>
            <p className="text-sm text-indigo-200/80 mb-8">Surreal dream illustration in progress...</p>
            <div className="w-full max-w-xs mx-auto bg-tertiary rounded-full h-2 overflow-hidden">
              <div className="h-full w-[70%] bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse rounded-full" />
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
        ) : showPreviewPlaceholder ? (
          <>
            <div className="card mb-6">
              <div className="relative aspect-square w-full rounded-lg border-4 border-dashed border-indigo/50 bg-indigo/10 flex items-center justify-center min-h-[280px]">
                <p className="text-text-secondary text-center px-4">
                  테스트 화면입니다.<br />결제 시 DALL·E로 생성된 꿈 이미지가 여기에 표시됩니다.
                </p>
              </div>
            </div>
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
            <button onClick={() => navigate('/result?preview=1')} className="btn-primary w-full">
              결과로 돌아가기
            </button>
          </>
        ) : dreamImage ? (
          <>
            <div className="card mb-6">
              <div className="relative">
                <img
                  src={displayImageUrl || dreamImage}
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

            <div className="flex flex-col gap-3 mb-6">
              <div className="flex gap-4">
                <button onClick={handleSave} className="btn-primary flex-1">
                  {t('visualize.save')}
                </button>
                <button onClick={handleShareToStory} className="btn-primary flex-1">
                  {t('visualize.shareToStory')}
                </button>
              </div>
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
