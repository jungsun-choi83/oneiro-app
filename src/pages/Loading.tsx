import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore, type DreamResult } from '../store/dreamStore'
import { getTelegramUserId } from '../lib/telegram'
import LanguageSelector from '../components/LanguageSelector'
import i18n from '../i18n/config'

const LOADING_STEPS = ['step1', 'step2', 'step3']

export default function Loading() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { dreamText, mood, isRecurring, setDreamResult, setUsedMockData, interpretLanguage } = useDreamStore()
  const requestLangFromNav = (location.state as { requestLanguage?: string })?.requestLanguage
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [, setDebugInfo] = useState<{
    apiCalling: boolean
    apiSuccess: boolean | null
    usingMock: boolean
    supabaseConfigured: boolean
  }>({
    apiCalling: false,
    apiSuccess: null,
    usingMock: false,
    supabaseConfigured: false,
  })
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
      const requestLang = requestLangFromNav ?? (interpretLanguage || (typeof window !== 'undefined' ? localStorage.getItem('oneiro_language') : null) || i18n.language || 'en').split('-')[0]
      
      // 즉시 로그 출력 (가장 먼저)
      if (typeof window !== 'undefined') {
        console.log('🚀 [ONEIRO] ========== 꿈 해석 시작 ==========')
        console.log('📝 [ONEIRO] 꿈 텍스트:', dreamText?.substring(0, 100))
        console.log('🔍 [ONEIRO] 환경 변수 체크 시작...')
      }
      
      try {
        // Supabase 환경 변수 확인 (없으면 fallback 사용)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qjcjrnogkhaiewoqjrns.supabase.co'
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqY2pybm9na2hhaWV3b3Fqcm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNTYxOTQsImV4cCI6MjA4NjkzMjE5NH0.A9ZdwitLc1UgdAcdHbM-Rpg53XEWD2BWPwP1VjEhYwY'
        
        // 즉시 환경 변수 상태 출력
        if (typeof window !== 'undefined') {
          console.log('🔍 [ONEIRO] 환경 변수 상태:', {
            VITE_SUPABASE_URL: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 없음',
            VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ 없음',
            '전체 URL': supabaseUrl || '없음',
            '전체 Key': supabaseAnonKey ? '있음 (길이: ' + supabaseAnonKey.length + ')' : '없음'
          })
        }
        
        // fetch로 직접 호출하므로 URL과 Key만 있으면 됨
        const hasValidConfig = !!(supabaseUrl && supabaseAnonKey)
        
        if (!hasValidConfig) {
          if (typeof window !== 'undefined') {
            console.error('❌ [ONEIRO] ========== Supabase 환경 변수 미설정 ==========')
            console.error('❌ [ONEIRO] Supabase 환경 변수 미설정:', {
              hasUrl: !!supabaseUrl,
              hasAnonKey: !!supabaseAnonKey,
              envUrl: import.meta.env.VITE_SUPABASE_URL ? '있음' : '없음',
              envKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '있음' : '없음',
              message: 'Vercel에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정하고 재배포하세요. 지금은 mock 데이터를 사용합니다.'
            })
            console.error('❌ [ONEIRO] Mock 데이터 사용 - 같은 해석이 나옵니다!')
            console.error('❌ [ONEIRO] ==========================================')
          }
          // Supabase 미설정 시 mock 사용
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
          setUsedMockData(true)
          setProgress(100)
          doneRef.current = true
          setTimeout(() => navigate(getTelegramUserId() ? '/result' : '/result?preview=1'), 500)
          return
        }

        const telegramUserId = getTelegramUserId()
        // 브라우저 직접 접속 등 Telegram 미연동 시 guest(-1)로 실제 API 호출 → 꿈마다 다른 해석
        const effectiveUserId = telegramUserId ?? -1
        
        // Supabase가 설정되어 있으면 실제 API 호출 시도
        if (hasValidConfig) {
          setDebugInfo(prev => ({ ...prev, apiCalling: true, supabaseConfigured: true }))
          if (typeof window !== 'undefined') {
            console.log('✅ [ONEIRO] ========== 실제 API 호출 시작 ==========')
            console.log('✅ [ONEIRO] 실제 API 호출 시도 (꿈마다 다른 해석이 나옵니다)', {
              dreamText: dreamText?.substring(0, 50),
              telegramUserId: effectiveUserId,
              supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
              hasAnonKey: !!supabaseAnonKey
            })
          }

          try {
            // Edge Function URL (텔레그램 WebView에서 fetch가 더 안정적)
            const edgeUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/interpret-dream`
            
            const res = await fetch(edgeUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                dreamText,
                mood,
                isRecurring,
                telegramUserId: effectiveUserId,
                language: requestLang,
              }),
            })

            const data = await res.json().catch(() => ({}))
            
            if (!res.ok) {
              const errMsg = data?.error || res.statusText || 'Interpretation failed'
              if (typeof window !== 'undefined') {
                console.error('❌ [ONEIRO] interpret-dream API error:', { status: res.status, data, errMsg })
              }
              throw new Error(errMsg)
            }
            if (data?.error) {
              if (typeof window !== 'undefined') {
                console.error('❌ [ONEIRO] interpret-dream data.error:', data.error)
              }
              throw new Error(typeof data.error === 'string' ? data.error : 'Interpretation failed. Please try again.')
            }

            if (typeof window !== 'undefined') {
              console.log('✅ [ONEIRO] ========== API 호출 성공! ==========')
              console.log('✅ [ONEIRO] interpret-dream API 성공! 꿈마다 다른 해석이 나옵니다.', {
                essence: data?.essence?.substring(0, 50),
                symbols: data?.symbols?.map((s: { name?: string }) => s.name),
                hiddenMeaning: data?.hiddenMeaning?.substring(0, 50),
                _fromApi: data?._fromApi
              })
              console.log('✅ [ONEIRO] ==========================================')
            }
            setDebugInfo(prev => ({ ...prev, apiCalling: false, apiSuccess: true, usingMock: false }))
            // API 응답에서 _fromApi 제거 후 저장
            const { _fromApi: _, ...cleanData } = data as Record<string, unknown>
            setDreamResult(cleanData as unknown as DreamResult)
            setProgress(100)
            doneRef.current = true
            setTimeout(() => {
              navigate(getTelegramUserId() ? '/result' : '/result?preview=1')
            }, 500)
            return
          } catch (apiErr) {
            // API 호출 실패 시 mock으로 폴백
            setDebugInfo(prev => ({ ...prev, apiCalling: false, apiSuccess: false, usingMock: true }))
            if (typeof window !== 'undefined') {
              console.error('⚠️ [ONEIRO] ========== API 호출 실패 ==========')
              console.error('⚠️ [ONEIRO] API 호출 실패, mock 데이터 사용:', {
                error: apiErr,
                message: apiErr instanceof Error ? apiErr.message : String(apiErr),
                stack: apiErr instanceof Error ? apiErr.stack : undefined
              })
              console.error('⚠️ [ONEIRO] Mock 데이터 사용 - 같은 해석이 나옵니다!')
              console.error('⚠️ [ONEIRO] ==========================================')
            }
            // 아래 mock 코드로 계속 진행
          }
        } else {
          // Supabase 미설정 시 mock 사용
          setDebugInfo(prev => ({ ...prev, supabaseConfigured: false, usingMock: true }))
        }
        
        // Mock 데이터 사용 (Supabase 미설정 또는 API 실패 시)
        if (typeof window !== 'undefined') {
          console.log('📝 [ONEIRO] ========== Mock 데이터 사용 ==========')
          console.log('📝 [ONEIRO] Mock 데이터 사용 (항상 같은 해석)')
          console.log('📝 [ONEIRO] 이 메시지가 보이면 환경 변수가 설정되지 않았거나 API 호출이 실패한 것입니다.')
          console.log('📝 [ONEIRO] ==========================================')
        }
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
        setUsedMockData(true)
        setProgress(100)
        doneRef.current = true
        setTimeout(() => navigate(getTelegramUserId() ? '/result' : '/result?preview=1'), 500)
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
    }, 60000)

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
