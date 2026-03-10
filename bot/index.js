const { Telegraf } = require('telegraf')
require('dotenv').config()

// 임시: Railway 환경 변수 문제 우회를 위해 토큰을 직접 넣음
const trimmedToken = '8565337401:AAFT65iRMb9T6fWTwmMXWd_H8x02sNSsHrQ'

const bot = new Telegraf(trimmedToken)

// Start command with referral handling
bot.start(async (ctx) => {
  const startParam = ctx.message.text.split(' ')[1] // Get referral code from /start CODE
  
  if (startParam && startParam.startsWith('ONEIRO-')) {
    // Handle referral
    const telegramUserId = ctx.from.id
    try {
      const response = await fetch(`${process.env.SUPABASE_FUNCTION_URL || 'https://your-project.supabase.co'}/functions/v1/handle-referral`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          telegramUserId,
          referralCode: startParam,
        }),
      })
      
      if (response.ok) {
        ctx.reply('🎁 Referral code applied! You and your friend both benefit.')
      }
    } catch (err) {
      console.error('Referral error:', err)
    }
  }
  
  ctx.reply(
    '🌙 Welcome to ONEIRO! Tell us your dream and discover what your soul is trying to say.',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✨ Start Dream Interpretation',
              web_app: { url: process.env.MINI_APP_URL || 'https://your-app.vercel.app' },
            },
          ],
        ],
      },
    }
  )
})

// Dream command - deep link to dream input
bot.command('dream', (ctx) => {
  ctx.reply('🌙 Share your dream with ONEIRO', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '✨ Interpret My Dream',
            web_app: { url: `${process.env.MINI_APP_URL || 'https://your-app.vercel.app'}/dream` },
          },
        ],
      ],
    },
  })
})

// Pre-checkout query handler (필수: 결제 허용 응답을 해야 결제가 완료됨)
bot.on('pre_checkout_query', async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true)
    console.log('[ONEIRO] pre_checkout_query answered OK, payload:', ctx.preCheckoutQuery.invoice_payload)
  } catch (err) {
    console.error('[ONEIRO] pre_checkout_query answer error:', err)
    try {
      await ctx.answerPreCheckoutQuery(false, err.message || 'Payment could not be processed.')
    } catch (e) {
      console.error('[ONEIRO] answerPreCheckoutQuery(false) failed:', e)
    }
  }
})

// Successful payment handler
bot.on('successful_payment', async (ctx) => {
  const payment = ctx.message.successful_payment
  const rawPayload = payment.invoice_payload || ''
  let product = ''
  let telegramUserId = ''
  try {
    if (rawPayload.startsWith('{')) {
      const parsed = JSON.parse(rawPayload)
      product = parsed.product
      telegramUserId = parsed.telegramUserId
    } else {
      const parts = rawPayload.split('_')
      product = parts[0] || ''
      telegramUserId = parts[1] || ''
    }
  } catch (e) {
    console.error('Payload parse error:', e)
  }
  console.log('[ONEIRO] Successful payment:', { product, telegramUserId, rawPayload })
  ctx.reply('✅ Payment successful! Your content has been unlocked.')
})

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err)
  ctx.reply('An error occurred. Please try again later.')
})

// Start bot
bot.launch()

console.log('ONEIRO Bot is running...')

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
