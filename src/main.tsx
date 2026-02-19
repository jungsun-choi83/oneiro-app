import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import telegramAnalytics from '@telegram-apps/analytics'
import './index.css'
import App from './App.tsx'
import './i18n/config.ts'
import { initTelegram } from './lib/telegram'

// Telegram Mini App으로 열렸을 때 초기화 (결제/공유 버튼 동작에 필요)
initTelegram()

// Telegram Apps Center 등록을 위한 Analytics SDK (앱 렌더 전에 초기화)
const analyticsToken = import.meta.env.VITE_TELEGRAM_ANALYTICS_TOKEN
const analyticsAppName = import.meta.env.VITE_TELEGRAM_ANALYTICS_APP_NAME
if (analyticsToken && analyticsAppName) {
  telegramAnalytics.init({
    token: analyticsToken,
    appName: analyticsAppName,
  })
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
