import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { telegramUserId, referralCode } = await req.json()

    if (!telegramUserId || !referralCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find referrer
    const { data: referrer } = await supabase
      .from('dream_users')
      .select('telegram_id, referral_count, free_credits_earned')
      .eq('referral_code', referralCode)
      .single()

    if (!referrer) {
      return new Response(
        JSON.stringify({ error: 'Invalid referral code' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('dream_users')
      .select('id, referred_by')
      .eq('telegram_id', telegramUserId)
      .single()

    if (existingUser?.referred_by) {
      return new Response(
        JSON.stringify({ error: 'User already referred' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Create or update user with referral
    if (existingUser) {
      await supabase
        .from('dream_users')
        .update({ referred_by: referrer.telegram_id })
        .eq('telegram_id', telegramUserId)
    } else {
      await supabase
        .from('dream_users')
        .insert({
          telegram_id: telegramUserId,
          referred_by: referrer.telegram_id,
          referral_code: `ONEIRO-${telegramUserId}`,
        })
    }

    // Update referrer's count
    const newCount = (referrer.referral_count || 0) + 1
    let freeCreditsEarned = referrer.free_credits_earned || 0

    // Award free credit if threshold reached
    if (newCount >= 3 && freeCreditsEarned === 0) {
      freeCreditsEarned = 1
    }

    await supabase
      .from('dream_users')
      .update({
        referral_count: newCount,
        free_credits_earned: freeCreditsEarned,
      })
      .eq('telegram_id', referrer.telegram_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        referralCount: newCount,
        freeCreditEarned: freeCreditsEarned > 0
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
