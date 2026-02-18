import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

const SYMBOLS_POOL = [
  { emoji: '🦋', name: 'Butterfly', meaning: 'Transformation is near. Pay attention to changes in your life.' },
  { emoji: '🌊', name: 'Ocean', meaning: 'Emotions run deep. Trust your intuition.' },
  { emoji: '🕊️', name: 'Dove', meaning: 'Peace and new beginnings await you.' },
  { emoji: '🏔️', name: 'Mountain', meaning: 'Challenges ahead, but you have the strength to overcome.' },
  { emoji: '🌙', name: 'Moon', meaning: 'Your subconscious is speaking. Listen carefully.' },
  { emoji: '⭐', name: 'Star', meaning: 'Hope and guidance are with you.' },
  { emoji: '🔥', name: 'Fire', meaning: 'Passion and transformation are awakening.' },
  { emoji: '🌳', name: 'Tree', meaning: 'Growth and stability are coming your way.' },
  { emoji: '🦅', name: 'Eagle', meaning: 'Freedom and higher perspective await.' },
  { emoji: '🐍', name: 'Snake', meaning: 'Healing and renewal are in progress.' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  try {
    const { date } = await req.json().catch(() => ({}))
    const today = date || new Date().toDateString()

    // Use date as seed for consistent daily symbol
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = seed % SYMBOLS_POOL.length
    const symbol = SYMBOLS_POOL[index]

    // Optionally enhance with GPT for variety
    try {
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'Generate a dream symbol for today. Return JSON with emoji, name, and meaning (2 sentences).',
            },
            {
              role: 'user',
              content: `Date: ${today}`,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 100,
        }),
      })

      if (gptResponse.ok) {
        const gptData = await gptResponse.json()
        const enhanced = JSON.parse(gptData.choices[0].message.content)
        return new Response(
          JSON.stringify(enhanced),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        )
      }
    } catch (err) {
      console.error('GPT enhancement failed, using pool:', err)
    }

    return new Response(
      JSON.stringify(symbol),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
