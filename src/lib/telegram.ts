export const initTelegram = async () => {
  try {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      return tg
    }
  } catch (error) {
    console.error('Telegram WebApp not available:', error)
  }
  return null
}

export const getTelegramUserId = (): number | null => {
  try {
    const tg = window.Telegram?.WebApp
    return tg?.initDataUnsafe?.user?.id || null
  } catch {
    return null
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initDataUnsafe?: {
          user?: {
            id: number
            username?: string
            first_name?: string
          }
        }
        openInvoice: (url: string, callback?: (status: string) => void) => void
        openLink: (url: string) => void
        showAlert: (message: string) => void
      }
    }
  }
}
