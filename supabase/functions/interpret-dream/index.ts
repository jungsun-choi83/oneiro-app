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
    const { dreamText, mood, isRecurring, telegramUserId, language } = await req.json()

    if (!dreamText || !telegramUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const lang = language || 'en'
    const langInstruction = lang === 'ko' 
      ? 'Write ALL of your response (essence, hiddenMeaning, symbols name/meaning, deepInsight, psychologicalShadow, easternProphecy, spiritualAdvice, advice, spiritualMessage) in Korean (한국어).'
      : lang === 'ja'
      ? 'Write ALL of your response in Japanese (日本語).'
      : lang === 'es'
      ? 'Write ALL of your response in Spanish (Español).'
      : lang === 'ar'
      ? 'Write ALL of your response in Arabic (العربية).'
      : 'Write in sophisticated English.'

    // Build system prompt
    let systemPrompt = `You are the world's foremost Spiritual Dream Analyst.
You combine Carl Jung's Analytical Psychology, Oriental Oneiromancy (동양 해몽 with Five Elements and Fortune Theory),
and Western symbolism to interpret dreams.
You don't just explain dreams — you decode the spiritual messages
that the dreamer's unconscious mind is sending.
Your tone is ethereal, elegant, warm, and caring.
${langInstruction}

Given the user's dream description, provide:
1. essence: A one-line poetic summary of the dream's core meaning (max 15 words)
2. hiddenMeaning: A cliffhanger-style single sentence that maximizes curiosity. Format: "Your unconscious mind has been hiding a massive signal. This dream is not just a memory, but carries [symbol keyword] that could change your destiny." Use dramatic, intriguing language that makes the user want to unlock the full reading.
3. symbols: 3-5 key symbols from the dream with emoji + name + brief meaning. Extract the most powerful symbol for hiddenMeaning.
4. deepInsight: A comprehensive analysis (minimum 500 characters) combining:
   - Psychological Shadow: Analysis of the user's current psychological state projected through dream symbols (Jungian perspective)
   - Eastern Prophecy: Fortune analysis from Eastern divination perspective (Five Elements, auspicious/ominous signs)
   - Spiritual Advice: Specific spiritual guidance the user should practice in reality
5. psychologicalShadow: Detailed Jungian analysis of psychological shadow (part of deepInsight but separate for structure)
6. easternProphecy: Detailed Eastern fortune analysis (part of deepInsight but separate)
7. spiritualAdvice: Detailed spiritual practice guidance (part of deepInsight but separate)
8. advice: 3 specific actionable things the dreamer should do today
9. spiritualMessage: A warm, personal spiritual message (2-3 sentences)
10. emotionalTone: The dominant emotional energy of this dream (one word)

Return as JSON with these exact keys: essence, hiddenMeaning, symbols (array of {emoji, name, meaning}), deepInsight (minimum 500 chars), psychologicalShadow, easternProphecy, spiritualAdvice, advice (array), spiritualMessage, emotionalTone.`

    if (isRecurring) {
      systemPrompt += `\n\nThis is a recurring dream. Pay special attention to what the unconscious
is persistently trying to communicate. Recurring dreams often signal
unresolved issues or important life transitions.`
    }

    if (mood && mood.length > 0) {
      systemPrompt += `\n\nDream mood tags: ${mood.join(', ')}`
    }

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: dreamText },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API error')
    }

    const openaiData = await openaiResponse.json()
    const result = JSON.parse(openaiData.choices[0].message.content)

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: user } = await supabase
      .from('dream_users')
      .select('id')
      .eq('telegram_id', telegramUserId)
      .single()

    let userId = user?.id

    if (!userId) {
      const { data: newUser } = await supabase
        .from('dream_users')
        .insert({
          telegram_id: telegramUserId,
          language: 'en',
        })
        .select()
        .single()
      userId = newUser?.id
    }

    await supabase.from('dreams').insert({
      user_id: userId,
      telegram_id: telegramUserId,
      dream_text: dreamText,
      mood: mood || [],
      is_recurring: isRecurring || false,
      result: result,
    })

    return new Response(
      JSON.stringify(result),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
