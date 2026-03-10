import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

function errRes(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  try {
    const body = await req.json().catch(() => ({}))
    const dreamText = body.dreamText as string | undefined
    const symbols = body.symbols as string[] | undefined
    const emotionalTone = body.emotionalTone as string | undefined
    const telegramUserId = body.telegramUserId != null ? Number(body.telegramUserId) : NaN

    if (!dreamText?.trim()) {
      return errRes('Missing dream text', 400)
    }
    if (Number.isNaN(telegramUserId) || telegramUserId === 0) {
      return errRes('Telegram user ID required. Open the app from Telegram.', 400)
    }
    if (!OPENAI_API_KEY) {
      return errRes('OpenAI not configured on server.', 503)
    }

    // Summarize dream for prompt (max ~200 chars)
    const summary =
      dreamText.length <= 200
        ? dreamText.trim()
        : dreamText.trim().slice(0, 197) + '...'
    const prompt = `Surreal dream illustration, cinematic lighting, mystical atmosphere, ${summary}`

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard',
      }),
    })

    if (!openaiRes.ok) {
      const errText = await openaiRes.text()
      console.error('OpenAI images error:', openaiRes.status, errText)
      return errRes(`Image generation failed (${openaiRes.status}). Try again later.`, 502)
    }

    const openaiData = (await openaiRes.json()) as {
      data?: Array<{ url?: string; revised_prompt?: string }>
    }
    const imageUrl = openaiData.data?.[0]?.url

    if (!imageUrl) {
      return errRes('No image URL in OpenAI response. Please try again.', 502)
    }

    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return errRes('Failed to fetch generated image.', 502)
    }
    const imageBytes = await imageRes.arrayBuffer()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const fileName = `${telegramUserId}/${Date.now()}.png`
    const { error: uploadError } = await supabase.storage
      .from('dream-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return errRes('Failed to save image. Please try again.', 503)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('dream-images').getPublicUrl(fileName)

    const artTitle =
      (emotionalTone ? `${emotionalTone} dream` : 'Dream') +
      (symbols?.length ? ` · ${symbols.slice(0, 2).join(', ')}` : '')

    const { data: latestDream } = await supabase
      .from('dreams')
      .select('id')
      .eq('telegram_id', telegramUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestDream?.id) {
      await supabase
        .from('dreams')
        .update({
          visualization_url: publicUrl,
          image_url: publicUrl,
          art_title: artTitle,
        })
        .eq('id', latestDream.id)
    }

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, artTitle }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('visualize-dream error:', message, error)
    return errRes(message, 500)
  }
})
