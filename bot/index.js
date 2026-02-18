const { Telegraf } = require('telegraf')
require('dotenv').config()

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

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

// Pre-checkout query handler
bot.on('pre_checkout_query', (ctx) => {
  ctx.answerPreCheckoutQuery(true)
})

// Successful payment handler
bot.on('successful_payment', async (ctx) => {
  const payment = ctx.message.successful_payment
  const payload = JSON.parse(payment.invoice_payload || '{}')
  
  // Handle payment completion
  // Update database, unlock content, etc.
  
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
