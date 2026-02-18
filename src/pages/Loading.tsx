import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'

const LOADING_STEPS = ['step1', 'step2', 'step3']

export default function Loading() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamText, mood, isRecurring, setDreamResult } = useDreamStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [moonPhase, setMoonPhase] = useState(0)

  useEffect(() => {
    // Moon animation
    const moonInterval = setInterval(() => {
      setMoonPhase((prev) => (prev + 1) % 100)
    }, 50)

    // Loading steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 2000)

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 80) {
          return prev + 2
        }
        return prev
      })
    }, 100)

    return () => {
      clearInterval(moonInterval)
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  useEffect(() => {
    const interpretDream = async () => {
      try {
        // Check if Supabase is configured
        if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
          // Use mock data for development
          await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API delay
          
          const mockResult = {
            essence: "Your dream reveals hidden emotions seeking expression.",
            hiddenMeaning: "Your unconscious mind has been hiding a massive signal. This dream is not just a memory, but carries the transformative power of the ocean that could change your destiny.",
            symbols: [
              { emoji: "🌊", name: "Ocean", meaning: "Deep emotions and the unconscious" },
              { emoji: "🦋", name: "Butterfly", meaning: "Transformation and change" },
              { emoji: "🌙", name: "Moon", meaning: "Intuition and feminine energy" }
            ],
            deepInsight: "Your dream is a window into your subconscious mind. The symbols you encountered represent aspects of your inner world that are seeking recognition. The ocean symbolizes the depth of your emotions, while the butterfly suggests you are in a period of transformation. The moon's presence indicates that your intuition is guiding you through this phase of change. Pay attention to the feelings these symbols evoke, as they hold keys to understanding your current life situation.",
            psychologicalShadow: "From a Jungian perspective, the ocean in your dream represents the vast unconscious realm where repressed emotions and archetypal patterns reside. The depth suggests you are being called to explore aspects of yourself that have been submerged. The butterfly transformation indicates your shadow is ready to integrate, moving from one state of being to another. This is a powerful moment of individuation where your conscious and unconscious minds are seeking balance.",
            easternProphecy: "In Eastern divination, water (海) represents wisdom and emotional flow. The appearance of water in your dream during this period suggests favorable changes in your emotional and financial realms. The butterfly (蝴蝶) is an auspicious symbol indicating transformation and new beginnings. Combined with the moon (月), which represents yin energy and intuition, this dream suggests a period of 3-6 months where your inner wisdom will guide you toward significant life changes. The timing is propitious for making important decisions.",
            spiritualAdvice: "Your dream is a spiritual call to embrace your emotional depth. Practice daily meditation near water if possible, or visualize yourself floating in a calm ocean. The butterfly teaches you to trust the process of transformation—what feels like endings are actually beginnings. Keep a dream journal for the next 30 days to track patterns. The moon's energy suggests you should pay attention to your intuition, especially during the new and full moon phases. Create a small altar with symbols of water and transformation to honor this spiritual message.",
            advice: [
              "Take time for self-reflection today",
              "Trust your intuition when making decisions",
              "Express your emotions through creative activities"
            ],
            emotionalTone: "contemplative",
            spiritualMessage: "Your soul is communicating through these symbols. Trust the messages you receive and allow yourself to grow through this understanding."
          }
          
          setDreamResult(mockResult)
          setProgress(100)

          setTimeout(() => {
            navigate('/result')
          }, 500)
          return
        }

        const telegramUserId = getTelegramUserId()

        // Telegram에서 열지 않았을 때(브라우저 직접 접속 등): mock 데이터로 결과 표시
        if (!telegramUserId) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          const mockResult = {
            essence: "Your dream reveals hidden emotions seeking expression.",
            hiddenMeaning: "Your unconscious mind has been hiding a massive signal. This dream is not just a memory, but carries the transformative power of the ocean that could change your destiny.",
            symbols: [
              { emoji: "🌊", name: "Ocean", meaning: "Deep emotions and the unconscious" },
              { emoji: "🦋", name: "Butterfly", meaning: "Transformation and change" },
              { emoji: "🌙", name: "Moon", meaning: "Intuition and feminine energy" }
            ],
            deepInsight: "Your dream is a window into your subconscious mind. The symbols you encountered represent aspects of your inner world that are seeking recognition. The ocean symbolizes the depth of your emotions, while the butterfly suggests you are in a period of transformation. The moon's presence indicates that your intuition is guiding you through this phase of change. Pay attention to the feelings these symbols evoke, as they hold keys to understanding your current life situation.",
            psychologicalShadow: "From a Jungian perspective, the ocean in your dream represents the vast unconscious realm where repressed emotions and archetypal patterns reside. The depth suggests you are being called to explore aspects of yourself that have been submerged. The butterfly transformation indicates your shadow is ready to integrate, moving from one state of being to another. This is a powerful moment of individuation where your conscious and unconscious minds are seeking balance.",
            easternProphecy: "In Eastern divination, water (海) represents wisdom and emotional flow. The appearance of water in your dream during this period suggests favorable changes in your emotional and financial realms. The butterfly (蝴蝶) is an auspicious symbol indicating transformation and new beginnings. Combined with the moon (月), which represents yin energy and intuition, this dream suggests a period of 3-6 months where your inner wisdom will guide you toward significant life changes. The timing is propitious for making important decisions.",
            spiritualAdvice: "Your dream is a spiritual call to embrace your emotional depth. Practice daily meditation near water if possible, or visualize yourself floating in a calm ocean. The butterfly teaches you to trust the process of transformation—what feels like endings are actually beginnings. Keep a dream journal for the next 30 days to track patterns. The moon's energy suggests you should pay attention to your intuition, especially during the new and full moon phases. Create a small altar with symbols of water and transformation to honor this spiritual message.",
            advice: [
              "Take time for self-reflection today",
              "Trust your intuition when making decisions",
              "Express your emotions through creative activities"
            ],
            emotionalTone: "contemplative",
            spiritualMessage: "Your soul is communicating through these symbols. Trust the messages you receive and allow yourself to grow through this understanding."
          }
          setDreamResult(mockResult)
          setProgress(100)
          setTimeout(() => navigate('/result'), 500)
          return
        }

        const { data, error: apiError } = await supabase.functions.invoke('interpret-dream', {
          body: {
            dreamText,
            mood,
            isRecurring,
            telegramUserId,
          },
        })

        if (apiError) throw apiError

        setDreamResult(data)
        setProgress(100)

        setTimeout(() => {
          navigate('/result')
        }, 500)
      } catch (err) {
        console.error('Error interpreting dream:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }

    const timeout = setTimeout(() => {
      if (!error) {
        setError('Request timeout')
      }
    }, 10000)

    interpretDream()

    return () => clearTimeout(timeout)
  }, [dreamText, mood, isRecurring, navigate, setDreamResult, error])

  const moonSize = 20 + (moonPhase / 100) * 60
  const moonOpacity = 0.3 + (moonPhase / 100) * 0.7

  return (
    <div className="min-h-screen bg-gradient-midnight flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center relative">
        {/* Language Selector */}
        <div className="absolute top-0 right-0">
          <LanguageSelector />
        </div>
        {/* Moon Animation */}
        <div className="mb-8 flex justify-center">
          <div
            className="rounded-full bg-moonlight shadow-moonlight-lg transition-all duration-500"
            style={{
              width: `${moonSize}px`,
              height: `${moonSize}px`,
              opacity: moonOpacity,
            }}
          />
        </div>

        {/* Loading Text */}
        <div className="mb-8 min-h-[60px]">
          <p className="text-xl text-white font-semibold">
            {t(`loading.${LOADING_STEPS[currentStep]}`)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-tertiary rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-indigo transition-all duration-300 rounded-full shadow-moonlight"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8">
            <p className="text-red-400 mb-4">{t('loading.error')}: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('loading.retry')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
