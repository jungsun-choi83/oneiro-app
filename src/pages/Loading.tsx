import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import { supabase } from '../lib/supabase'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'
import i18n from '../i18n/config'

const LOADING_STEPS = ['step1', 'step2', 'step3']

export default function Loading() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { dreamText, mood, isRecurring, setDreamResult, interpretLanguage } = useDreamStore()
  const requestLangFromNav = (location.state as { requestLanguage?: string })?.requestLanguage
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [moonPhase, setMoonPhase] = useState(0)
  const doneRef = useRef(false)

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
    doneRef.current = false
    const interpretDream = async () => {
      const requestLang = requestLangFromNav ?? (interpretLanguage || i18n.language || 'en').split('-')[0]
      try {
        // Check if Supabase is configured
        if (!supabase || !import.meta.env.VITE_SUPABASE_URL) {
          // Use mock data for development
          await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate API delay
          const devIsKo = requestLang === 'ko'
          const mockResult = devIsKo ? {
            essence: "당신의 꿈은 표현을 갈구하는 숨겨진 감정을 드러냅니다.",
            hiddenMeaning: "당신의 무의식이 숨기고 있는 거대한 신호가 발견되었습니다. 이 꿈은 단순한 기억이 아니라 당신의 운명을 바꿀 바다의 변혁적 힘을 품고 있습니다.",
            symbols: [
              { emoji: "🌊", name: "바다", meaning: "깊은 감정과 무의식" },
              { emoji: "🦋", name: "나비", meaning: "변화와 변형" },
              { emoji: "🌙", name: "달", meaning: "직관과 여성적 에너지" }
            ],
            deepInsight: "당신의 꿈은 무의식의 세계로 열리는 창입니다. 꿈속 상징들은 인정을 갈구하는 내면의 측면을 나타냅니다.",
            psychologicalShadow: "융의 관점에서, 꿈속 바다는 억압된 감정과 원형이 머무는 무의식의 영역을 상징합니다.",
            easternProphecy: "동양 해몽에서 물(海)은 지혜와 감정의 흐름을 나타냅니다.",
            spiritualAdvice: "물가에서 명상하거나 고요한 바다를 상상해 보세요. 30일간 꿈 일기를 써 보세요.",
            advice: ["오늘 하루 자기 성찰 시간을 가지세요", "결정할 때 직관을 믿으세요", "창작 활동으로 감정을 표현해 보세요"],
            emotionalTone: "명상적",
            spiritualMessage: "영혼이 이 상징들을 통해 말하고 있습니다. 전해지는 메시지를 믿고 성장을 받아들이세요."
          } : {
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
          doneRef.current = true
          setTimeout(() => navigate('/result'), 500)
          return
        }

        const telegramUserId = getTelegramUserId()

        // Telegram에서 열지 않았을 때(브라우저 직접 접속 등): mock 데이터로 결과 표시
        if (!telegramUserId) {
          await new Promise(resolve => setTimeout(resolve, 3000))
          const isKo = requestLang === 'ko'
          const mockResult = isKo ? {
            essence: "당신의 꿈은 표현을 갈구하는 숨겨진 감정을 드러냅니다.",
            hiddenMeaning: "당신의 무의식이 숨기고 있는 거대한 신호가 발견되었습니다. 이 꿈은 단순한 기억이 아니라 당신의 운명을 바꿀 바다의 변혁적 힘을 품고 있습니다.",
            symbols: [
              { emoji: "🌊", name: "바다", meaning: "깊은 감정과 무의식" },
              { emoji: "🦋", name: "나비", meaning: "변화와 변형" },
              { emoji: "🌙", name: "달", meaning: "직관과 여성적 에너지" }
            ],
            deepInsight: "당신의 꿈은 무의식의 세계로 열리는 창입니다. 꿈속 상징들은 인정을 갈구하는 내면의 측면을 나타냅니다. 바다는 감정의 깊이를, 나비는 변형의 시기를, 달은 직관이 이 변화를 이끌고 있음을 말해줍니다.",
            psychologicalShadow: "융의 관점에서, 꿈속 바다는 억압된 감정과 원형이 머무는 무의식의 영역을 상징합니다. 나비의 변형은 그림자가 통합될 준비가 되었음을 보여주며, 의식과 무의식의 균형을 향한 개성화의 순간입니다.",
            easternProphecy: "동양 해몽에서 물(海)은 지혜와 감정의 흐름을 나타냅니다. 꿈속 물과 나비(蝴蝶), 달(月)의 조합은 3~6개월 내 감정·재물·직관 측면에서 유리한 변화를 암시합니다.",
            spiritualAdvice: "물가에서 명상하거나 고요한 바다를 상상해 보세요. 나비는 끝이 아닌 시작을, 달은 보름달·그믐달에 직관에 귀 기울이라 전합니다. 30일간 꿈 일기를 써 보세요.",
            advice: [
              "오늘 하루 자기 성찰 시간을 가지세요",
              "결정할 때 직관을 믿으세요",
              "창작 활동으로 감정을 표현해 보세요"
            ],
            emotionalTone: "명상적",
            spiritualMessage: "영혼이 이 상징들을 통해 말하고 있습니다. 전해지는 메시지를 믿고 성장을 받아들이세요."
          } : {
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
          doneRef.current = true
          setTimeout(() => navigate('/result'), 500)
          return
        }

        const { data, error: apiError } = await supabase.functions.invoke('interpret-dream', {
          body: {
            dreamText,
            mood,
            isRecurring,
            telegramUserId,
            language: requestLang,
          },
        })

        if (apiError) {
          const msg = (apiError as { context?: { body?: { error?: string } } })?.context?.body?.error
            || (apiError as Error).message
          throw new Error(msg || 'Interpretation failed. Please try again.')
        }
        if (data?.error) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Interpretation failed. Please try again.')
        }

        setDreamResult(data)
        setProgress(100)
        doneRef.current = true
        setTimeout(() => {
          navigate('/result')
        }, 500)
      } catch (err) {
        console.error('Error interpreting dream:', err)
        doneRef.current = true
        const msg = err instanceof Error ? err.message : 'Unknown error'
        const friendly = msg.includes('non-2xx') || msg.includes('Edge')
          ? (t('error.serverError', { defaultValue: '서버 일시 오류입니다. 잠시 후 다시 시도해 주세요.' }))
          : msg
        setError(friendly)
      }
    }

    const timeout = setTimeout(() => {
      if (!doneRef.current) {
        setError(t('error.timeout', { defaultValue: '요청 시간이 초과되었습니다. 다시 시도해 주세요.' }))
      }
    }, 10000)

    interpretDream()

    return () => clearTimeout(timeout)
  }, [dreamText, mood, isRecurring, navigate, setDreamResult, requestLangFromNav, interpretLanguage])

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
