import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDreamStore } from '../store/dreamStore'
import LanguageSelector from '../components/LanguageSelector'

const MOODS = ['scary', 'peaceful', 'confusing', 'vivid', 'recurring', 'lucid']

export default function DreamInput() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { dreamText, mood, isRecurring, setDreamText, setMood, setIsRecurring } = useDreamStore()
  
  const [selectedMoods, setSelectedMoods] = useState<string[]>(mood)
  const [text, setText] = useState(dreamText)
  
  const handleMoodToggle = (moodKey: string) => {
    const newMoods = selectedMoods.includes(moodKey)
      ? selectedMoods.filter(m => m !== moodKey)
      : [...selectedMoods, moodKey]
    setSelectedMoods(newMoods)
    setMood(newMoods)
  }
  
  const handleSubmit = () => {
    if (text.length >= 20) {
      setDreamText(text)
      navigate('/loading')
    }
  }
  
  const isValid = text.length >= 20 && text.length <= 2000
  
  return (
    <div className="min-h-screen bg-gradient-midnight p-6">
      <div className="max-w-2xl mx-auto">
        {/* Language Selector */}
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌙</div>
          <h1 className="text-3xl font-title font-bold text-white mb-2">
            {t('app.name')}
          </h1>
          <p className="text-text-secondary">{t('app.tagline')}</p>
        </div>
        
        {/* Main Input */}
        <div className="card mb-6">
          <label className="block text-xl font-semibold mb-4 text-white">
            {t('dream.title')}
          </label>
          <textarea
            className="input-field w-full min-h-[200px] resize-none"
            placeholder={t('dream.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-between items-center mt-2 text-sm text-text-secondary">
            <span>
              {text.length < 20 ? t('dream.minLength') : t('dream.maxLength')}
            </span>
            <span>{t('dream.charCount', { count: text.length })}</span>
          </div>
        </div>
        
        {/* Mood Tags */}
        <div className="card mb-6">
          <label className="block text-lg font-semibold mb-4 text-white">
            Mood Tags
          </label>
          <div className="flex flex-wrap gap-3">
            {MOODS.map((moodKey) => (
              <button
                key={moodKey}
                onClick={() => handleMoodToggle(moodKey)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  selectedMoods.includes(moodKey)
                    ? 'border-indigo bg-indigo/20 text-indigo-light'
                    : 'border-tertiary text-text-secondary hover:border-indigo/50'
                }`}
              >
                {t(`dream.moods.${moodKey}`)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Recurring Toggle */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <label className="text-lg font-semibold text-white">
              {t('dream.recurring')}
            </label>
            <button
              onClick={() => {
                const newValue = !isRecurring
                setIsRecurring(newValue)
                if (newValue && !selectedMoods.includes('recurring')) {
                  handleMoodToggle('recurring')
                }
              }}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isRecurring ? 'bg-indigo' : 'bg-tertiary'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isRecurring ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="btn-primary w-full text-lg"
        >
          {t('dream.interpret')}
        </button>
      </div>
    </div>
  )
}
