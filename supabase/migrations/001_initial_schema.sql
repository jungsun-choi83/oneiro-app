-- Dream Users Table
CREATE TABLE IF NOT EXISTS dream_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  language TEXT DEFAULT 'en',
  free_readings_used INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referral_count INTEGER DEFAULT 0,
  free_credits_earned INTEGER DEFAULT 0,
  referred_by BIGINT REFERENCES dream_users(telegram_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dreams Table
CREATE TABLE IF NOT EXISTS dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES dream_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  dream_text TEXT NOT NULL,
  mood TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  result JSONB,
  image_url TEXT,
  art_title TEXT,
  full_reading_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dream Payments Table
CREATE TABLE IF NOT EXISTS dream_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES dream_users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  product TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XTR',
  payment_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dreams_telegram_id ON dreams(telegram_id);
CREATE INDEX IF NOT EXISTS idx_dreams_created_at ON dreams(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dream_users_telegram_id ON dream_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_dream_users_referral_code ON dream_users(referral_code);
CREATE INDEX IF NOT EXISTS idx_dream_users_referred_by ON dream_users(referred_by);
CREATE INDEX IF NOT EXISTS idx_dream_payments_telegram_id ON dream_payments(telegram_id);

-- Storage Bucket for Dream Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dream-images', 'dream-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'dream-images');

CREATE POLICY IF NOT EXISTS "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dream-images');
