import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const PRICES = {
  full_reading: 50,
  dream_visualizer: 150,
  soul_report: 300,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  try {
    const { product, telegramUserId } = await req.json()

    if (!product || !telegramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const price = PRICES[product as keyof typeof PRICES]
    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Invalid product' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Create invoice via Telegram Bot API
    console.log('[create-invoice] Creating invoice:', { product, telegramUserId, price })
    
    if (!BOT_TOKEN) {
      console.error('[create-invoice] BOT_TOKEN missing')
      return new Response(
        JSON.stringify({ error: 'Bot token not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Stars 결제용 invoice payload (provider_token 생략 필수)
    const invoicePayload: any = {
      title: product === 'full_reading' ? 'Full Dream Reading' :
             product === 'dream_visualizer' ? 'Dream Visualizer' :
             'Soul Message Report',
      description: product === 'full_reading' ? 'Unlock complete dream interpretation' :
                   product === 'dream_visualizer' ? 'Transform your dream into AI art' :
                   'Detailed 7-day spiritual guidance report',
      payload: `${product}_${telegramUserId}_${Date.now()}`, // 짧고 고유한 payload
      currency: 'XTR', // Telegram Stars
      prices: [{ 
        label: `${price} Stars`, 
        amount: price // Stars는 정수여야 함 (최소 1)
      }],
      // provider_token은 Stars 결제 시 완전히 생략해야 함
    }
    
    // payload 길이 제한 확인 (최대 128 bytes)
    if (invoicePayload.payload.length > 128) {
      invoicePayload.payload = invoicePayload.payload.substring(0, 128)
    }
    
    // amount가 최소값(1) 이상인지 확인
    if (invoicePayload.prices[0].amount < 1) {
      console.error('[create-invoice] Invalid amount:', invoicePayload.prices[0].amount)
      return new Response(
        JSON.stringify({ error: 'Invalid price amount' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[create-invoice] Invoice payload:', invoicePayload)

    const invoiceResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    })

    const invoiceData = await invoiceResponse.json()
    console.log('[create-invoice] Telegram API response:', { ok: invoiceResponse.ok, status: invoiceResponse.status, data: invoiceData })

    if (!invoiceResponse.ok) {
      const errorMsg = invoiceData.description || invoiceData.error_code || 'Failed to create invoice'
      console.error('[create-invoice] Telegram API error:', errorMsg, invoiceData)
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          error_code: invoiceData.error_code,
          details: invoiceData.description 
        }),
        { status: invoiceResponse.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    if (!invoiceData.ok || !invoiceData.result) {
      console.error('[create-invoice] Invalid response:', invoiceData)
      return new Response(
        JSON.stringify({ error: 'Invalid invoice response from Telegram' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[create-invoice] Invoice created successfully:', invoiceData.result)
    return new Response(
      JSON.stringify({ invoice_url: invoiceData.result }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
