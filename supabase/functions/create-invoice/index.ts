import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''

const PRICES = {
  full_reading: 50,
  dream_visualizer: 150,
  soul_report: 300,
}

serve(async (req) => {
  try {
    const { product, telegramUserId } = await req.json()

    if (!product || !telegramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const price = PRICES[product as keyof typeof PRICES]
    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Invalid product' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create invoice via Telegram Bot API
    const invoiceResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: product === 'full_reading' ? 'Full Dream Reading' :
               product === 'dream_visualizer' ? 'Dream Visualizer' :
               'Soul Message Report',
        description: product === 'full_reading' ? 'Unlock complete dream interpretation' :
                     product === 'dream_visualizer' ? 'Transform your dream into AI art' :
                     'Detailed 7-day spiritual guidance report',
        payload: JSON.stringify({ product, telegramUserId }),
        // Telegram Stars(XTR): provider_token 생략 (디지털 상품은 빈 문자열도 넣으면 안 됨)
        currency: 'XTR',
        prices: [{ label: product, amount: price }],
      }),
    })

    if (!invoiceResponse.ok) {
      throw new Error('Failed to create invoice')
    }

    const invoiceData = await invoiceResponse.json()

    return new Response(
      JSON.stringify({ invoice_url: invoiceData.result }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
