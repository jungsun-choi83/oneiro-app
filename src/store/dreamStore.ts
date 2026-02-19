import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface DreamSymbol {
  emoji: string
  name: string
  meaning: string
}

export interface DreamResult {
  essence: string
  hiddenMeaning: string // 클리프행어 스타일의 한 문장
  deepInsight: string
  psychologicalShadow?: string // 칼 융 분석
  easternProphecy?: string // 동양 해몽
  spiritualAdvice?: string // 영적 조언
  advice: string[]
  symbols: DreamSymbol[]
  emotionalTone: string
  spiritualMessage: string
}

export interface DreamJournalEntry {
  id: string
  dreamText: string
  mood: string[]
  isRecurring: boolean
  result: DreamResult
  imageUrl?: string
  artTitle?: string
  fullReadingUnlocked: boolean
  createdAt: string
}

export interface UserProfile {
  telegramId: number
  username?: string
  language: string
  freeReadingsUsed: number
}

interface DreamState {
  dreamText: string
  mood: string[]
  isRecurring: boolean
  dreamResult: DreamResult | null
  dreamImage: string | null
  artTitle: string | null
  dreamJournal: DreamJournalEntry[]
  userProfile: UserProfile | null
  /** 언어 선택 후 해몽 요청 시점의 언어 (API/mock에서 사용) */
  interpretLanguage: string
  /** Supabase 미설정으로 mock 사용 시 true (Result에서 안내 배너용) */
  usedMockData: boolean
  setDreamText: (text: string) => void
  setMood: (mood: string[]) => void
  setIsRecurring: (isRecurring: boolean) => void
  setDreamResult: (result: DreamResult) => void
  setUsedMockData: (value: boolean) => void
  setDreamImage: (url: string) => void
  setArtTitle: (title: string) => void
  addToJournal: (entry: DreamJournalEntry) => void
  setUserProfile: (profile: UserProfile) => void
  setInterpretLanguage: (lang: string) => void
  resetDream: () => void
}

export const useDreamStore = create<DreamState>()(
  persist(
    (set) => ({
      dreamText: '',
      mood: [],
      isRecurring: false,
      dreamResult: null,
      dreamImage: null,
      artTitle: null,
      dreamJournal: [],
      userProfile: null,
      interpretLanguage: 'en',
      usedMockData: false,
      setDreamText: (text) => set({ dreamText: text }),
      setMood: (mood) => set({ mood }),
      setIsRecurring: (isRecurring) => set({ isRecurring }),
      setDreamResult: (result) => set({ dreamResult: result, usedMockData: false }),
      setUsedMockData: (value) => set({ usedMockData: value }),
      setDreamImage: (url) => set({ dreamImage: url }),
      setArtTitle: (title) => set({ artTitle: title }),
      addToJournal: (entry) =>
        set((state) => ({
          dreamJournal: [entry, ...state.dreamJournal],
        })),
      setUserProfile: (profile) => set({ userProfile: profile }),
      setInterpretLanguage: (lang) => set({ interpretLanguage: lang }),
      resetDream: () =>
        set({
          dreamText: '',
          mood: [],
          isRecurring: false,
          dreamResult: null,
          dreamImage: null,
          artTitle: null,
        }),
    }),
    {
      name: 'oneiro-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
