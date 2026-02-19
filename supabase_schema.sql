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

-- Storage Policy (이미 정책이 있으면 에러 나므로, 처음 한 번만 실행)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'dream-images');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'dream-images');

-- ============================================
-- 실행 방법: Supabase Dashboard SQL Editor
-- ============================================

-- 프로젝트 REF란?
-- Supabase URL에서 "https://[프로젝트REF].supabase.co"의 [프로젝트REF] 부분입니다.
-- 예: VITE_SUPABASE_URL이 "https://abcdefghijklmnop.supabase.co"라면
--     프로젝트 REF는 "abcdefghijklmnop"입니다.

-- 방법 1: SQL Editor URL 직접 사용 (가장 빠름)
-- 1. .env 파일에서 VITE_SUPABASE_URL 확인 (예: https://abcdefghijklmnop.supabase.co)
-- 2. 프로젝트 REF 추출 (예: abcdefghijklmnop)
-- 3. 아래 URL의 [YOUR-PROJECT-REF]를 실제 REF로 교체:
--    https://app.supabase.com/project/[YOUR-PROJECT-REF]/sql/new
-- 4. 브라우저에 붙여넣고 Enter
-- 5. 이 파일 전체 내용을 복사 → SQL Editor에 붙여넣기 → Run 버튼 클릭

-- 방법 2: Dashboard에서 찾기
-- 1. https://app.supabase.com 접속
-- 2. 프로젝트 선택 → Settings → General → Reference ID 복사
-- 3. https://app.supabase.com/project/[복사한-REF]/sql/new 접속
-- 4. 이 파일 내용 붙여넣고 실행

-- 방법 2: Supabase CLI 사용 (로컬 개발)
-- supabase db push
-- 또는
-- supabase db reset  (기존 데이터 삭제 후 재생성)

-- 방법 3: psql 직접 실행
-- psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase_schema.sql
-- 또는 환경변수 사용:
-- psql $DATABASE_URL -f supabase_schema.sql

-- 방법 4: Supabase CLI로 원격 DB에 적용
-- supabase link --project-ref [YOUR-PROJECT-REF]
-- supabase db push
