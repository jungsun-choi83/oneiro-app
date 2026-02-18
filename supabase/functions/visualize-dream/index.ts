import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  try {
    const { dreamText, symbols, emotionalTone, telegramUserId } = await req.json()

    if (!dreamText || !telegramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting: 5 per 24 hours
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: recentVisualizations } = await supabase
      .from('dreams')
      .select('id')
      .eq('telegram_id', telegramUserId)
      .not('image_url', 'is', null)
      .gte('created_at', yesterday.toISOString())

    if (recentVisualizations && recentVisualizations.length >= 5) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Maximum 5 visualizations per 24 hours.' }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Generate image with DALL-E 3
    const prompt = `Create a surreal, ethereal digital painting depicting this dream: ${dreamText.substring(0, 500)}.
Key symbols: ${symbols?.join(', ') || 'dream symbols'}.
Emotional atmosphere: ${emotionalTone || 'mysterious'}.
Style: Dreamlike, luminous, somewhere between reality and fantasy.
Colors: Deep indigos, soft silvers, and moonlit tones.
Composition: Cinematic, wide format.
Quality: Museum-worthy digital art, highly detailed.`

    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      }),
    })

    if (!dalleResponse.ok) {
      throw new Error('DALL-E API error')
    }

    const dalleData = await dalleResponse.json()
    const imageUrl = dalleData.data[0].url

    // Download and upload to Supabase Storage
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageArrayBuffer = await imageBlob.arrayBuffer()
    const imageBytes = new Uint8Array(imageArrayBuffer)

    const fileName = `${telegramUserId}_${Date.now()}.png`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('dream-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('dream-images')
      .getPublicUrl(fileName)

    // Generate art title
    const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, poetic title (3-5 words) for this dream artwork.',
          },
          {
            role: 'user',
            content: `Dream: ${dreamText.substring(0, 200)}`,
          },
        ],
        max_tokens: 20,
        temperature: 0.8,
      }),
    })

    let artTitle = 'Dream Vision'
    if (titleResponse.ok) {
      const titleData = await titleResponse.json()
      artTitle = titleData.choices[0].message.content.trim().replace(/"/g, '')
    }

    // Update dream record
    const { data: user } = await supabase
      .from('dream_users')
      .select('id')
      .eq('telegram_id', telegramUserId)
      .single()

    if (user) {
      await supabase
        .from('dreams')
        .update({
          image_url: publicUrl,
          art_title: artTitle,
        })
        .eq('telegram_id', telegramUserId)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    return new Response(
      JSON.stringify({
        imageUrl: publicUrl,
        artTitle: artTitle,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
