import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import './i18n/config.ts'
import { initTelegram } from './lib/telegram'

// Telegram Mini App으로 열렸을 때 초기화 (결제/공유 버튼 동작에 필요)
initTelegram()

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
