# ONEIRO 텔레그램 배포 완전 가이드 (비전공자용)

이 가이드는 처음부터 끝까지 단계별로 설명합니다. 차근차근 따라하시면 됩니다!

---

## 📋 준비물 체크리스트

- [ ] Supabase 계정 (무료)
- [ ] Vercel 계정 (무료)
- [ ] OpenAI API 키 (유료, 사용량만큼 과금)
- [ ] Telegram 봇 토큰 (@BotFather에서 발급)

---

## 1단계: Supabase 프로젝트 생성

### 1-1. Supabase 가입 및 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭 → GitHub로 가입 (또는 이메일)
3. "New Project" 클릭
4. 프로젝트 정보 입력:
   - **Name**: `oneiro` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 후 **꼭 저장해두세요!**
   - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia)
5. "Create new project" 클릭
6. **2-3분 대기** (프로젝트 생성 중)

### 1-2. Supabase 정보 확인

프로젝트가 생성되면:

1. 왼쪽 메뉴에서 **Settings** (⚙️) 클릭
2. **API** 메뉴 클릭
3. 다음 정보를 메모장에 복사해두세요:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 문자열)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ 비밀! 절대 공개하지 마세요)

---

## 2단계: 데이터베이스 테이블 생성

### 2-1. SQL 에디터 열기

1. Supabase 대시보드 왼쪽 메뉴에서 **SQL Editor** 클릭
2. "New query" 클릭

### 2-2. SQL 코드 복사 및 실행

아래 코드를 **전부 복사**해서 SQL 에디터에 붙여넣기:

```sql
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
```

3. 오른쪽 하단 **RUN** 버튼 클릭
4. "Success. No rows returned" 메시지 확인

### 2-3. Storage 버킷 생성

1. 왼쪽 메뉴에서 **Storage** 클릭
2. "Create a new bucket" 클릭
3. 설정:
   - **Name**: `dream-images`
   - **Public bucket**: ✅ 체크 (공개로 설정)
4. "Create bucket" 클릭
5. 버킷이 생성되면 클릭 → **Policies** 탭 클릭
6. "New Policy" 클릭 → "For full customization" 선택
7. 아래 SQL 복사해서 붙여넣기:

```sql
dream-images

8. "Review" → "Save policy" 클릭

---

## 3단계: Supabase Edge Functions 배포

### 3-1. Supabase CLI (npx로 사용 — 설치 불필요)

**⚠️ `npm install -g supabase` 는 지원 중단되었습니다. 아래처럼 `npx` 로 실행하세요.**

프로젝트 폴더에서 Cursor 터미널을 열고, 아래 명령어에서 `supabase` 대신 **항상 `npx supabase`** 를 사용합니다.

### 3-2. Supabase 로그인

1. Cursor에서 터미널 열기 (Ctrl + `)
2. 프로젝트 폴더인지 확인: `C:\Users\choi jungsun\Desktop\ONEIRO`
3. 로그인:
   ```powershell
   npx supabase login
   ```
4. 브라우저가 열리면 GitHub로 로그인

### 3-3. 프로젝트 연결

1. Supabase 대시보드에서 **Settings** → **General** 클릭
2. **Reference ID** 복사 (예: `abcdefghijklmnop`)
3. 터미널에서:
   ```powershell
   npx supabase link --project-ref [여기에 Reference ID 붙여넣기]
   ```
   예: `npx supabase link --project-ref abcdefghijklmnop`

### 3-4. Edge Functions 배포

터미널에서 하나씩 실행 (반드시 `npx supabase` 사용):

```powershell
# 1. interpret-dream 함수 배포
npx supabase functions deploy interpret-dream

# 2. visualize-dream 함수 배포
npx supabase functions deploy visualize-dream

# 3. daily-symbol 함수 배포
npx supabase functions deploy daily-symbol

# 4. create-invoice 함수 배포
npx supabase functions deploy create-invoice

# 5. handle-referral 함수 배포
npx supabase functions deploy handle-referral
```

각 함수 배포 시 환경변수 설정 요청이 나올 수 있습니다. 일단 Enter로 넘어가고, 다음 단계에서 설정합니다.

### 3-5. Edge Functions 환경변수 설정

1. Supabase 대시보드 → **Edge Functions** 클릭
2. 각 함수마다 **Settings** (⚙️) 클릭
3. **Secrets** 탭에서 다음 추가:

**interpret-dream 함수:**
- `OPENAI_API_KEY`: [OpenAI API 키]
- `SUPABASE_URL`: [Project URL]
- `SUPABASE_SERVICE_ROLE_KEY`: [service_role key]

**visualize-dream 함수:**
- `OPENAI_API_KEY`: [OpenAI API 키]
- `SUPABASE_URL`: [Project URL]
- `SUPABASE_SERVICE_ROLE_KEY`: [service_role key]

**daily-symbol 함수:**
- `OPENAI_API_KEY`: [OpenAI API 키] (선택사항)

**create-invoice 함수:**
- `TELEGRAM_BOT_TOKEN`: [Telegram 봇 토큰] (4단계에서 받을 예정)

**handle-referral 함수:**
- `SUPABASE_URL`: [Project URL]
- `SUPABASE_SERVICE_ROLE_KEY`: [service_role key]

---

## 4단계: Telegram 봇 생성

### 4-1. BotFather에서 봇 생성

1. Telegram 앱 열기
2. 검색창에 `@BotFather` 입력
3. 대화 시작 → `/start` 입력
4. `/newbot` 입력
5. 봇 이름 입력: `ONEIRO Bot` (또는 원하는 이름)
6. 봇 사용자명 입력: `ONEIROBot` (또는 원하는 이름, 끝에 Bot 붙여야 함)
7. 봇 토큰 받기: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz` (이런 형식)
   **⚠️ 이 토큰을 메모장에 저장하세요!**

### 4-2. 봇 설정

BotFather와의 채팅에서:

```
/setdescription
ONEIROBot
Discover what your dreams are telling you with AI-powered dream interpretation. 🌙
```

```
/setabouttext
ONEIROBot
AI Dream Interpreter & Soul Guide - See what your dreams are telling you
```

```
/setuserpic
[봇 프로필 사진 업로드] (선택사항)
```

### 4-3. Mini App 설정

```
/setmenubutton
ONEIROBot
[버튼 텍스트]: Start Dream Interpretation
[URL]: [Vercel 배포 URL] (5단계에서 받을 예정, 일단 나중에 설정)
```

---

## 5단계: Vercel에 프론트엔드 배포

### 5-1. GitHub에 코드 업로드

1. https://github.com 접속 → 로그인
2. 우측 상단 **+** → **New repository** 클릭
3. 설정:
   - **Repository name**: `oneiro-app`
   - **Public** 선택
   - **Add a README file** 체크 해제
4. "Create repository" 클릭

### 5-2. GitHub Desktop 또는 Git 사용

**방법 1: GitHub Desktop 사용 (추천)**

1. https://desktop.github.com 다운로드 및 설치
2. GitHub Desktop 실행 → GitHub 로그인
3. **File** → **Add Local Repository**
4. `C:\Users\choi jungsun\Desktop\ONEIRO` 선택
5. 왼쪽 하단에 커밋 메시지 입력: `Initial commit`
6. **Commit to main** 클릭
7. **Publish repository** 클릭

**방법 2: 명령어 사용**

PowerShell에서:

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[당신의GitHub사용자명]/oneiro-app.git
git push -u origin main
```

### 5-3. Vercel 배포

1. https://vercel.com 접속 → GitHub로 로그인
2. **Add New** → **Project** 클릭
3. GitHub 저장소 선택: `oneiro-app`
4. **Import** 클릭
5. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. **Environment Variables** 섹션에서 추가:
   - `VITE_SUPABASE_URL`: [Supabase Project URL]
   - `VITE_SUPABASE_ANON_KEY`: [Supabase anon key]
7. **Deploy** 클릭
8. **2-3분 대기** → 배포 완료!
9. 배포된 URL 복사: `https://oneiro-app.vercel.app` (이런 형식)

### 5-4. Telegram Mini App URL 설정

1. BotFather와의 채팅으로 돌아가기
2. `/setmenubutton` 입력
3. `ONEIROBot` 선택
4. 버튼 텍스트: `Start Dream Interpretation`
5. URL: `https://oneiro-app.vercel.app` (Vercel에서 받은 URL)

---

## 6단계: 봇 서버 배포 (선택사항)

봇 서버는 두 가지 방법이 있습니다:

### 방법 1: 로컬에서 실행 (개발/테스트용)

1. `bot` 폴더로 이동:
   ```powershell
   cd "C:\Users\choi jungsun\Desktop\ONEIRO\bot"
   ```

2. `.env` 파일 생성:
   ```
   TELEGRAM_BOT_TOKEN=여기에봇토큰붙여넣기
   MINI_APP_URL=https://oneiro-app.vercel.app
   SUPABASE_FUNCTION_URL=https://프로젝트ID.supabase.co/functions/v1
   SUPABASE_ANON_KEY=여기에anon키붙여넣기
   ```

3. 패키지 설치:
   ```powershell
   npm install
   ```

4. 실행:
   ```powershell
   npm start
   ```

### 방법 2: Railway/Render에 배포 (24시간 실행)

**Railway 사용:**

1. https://railway.app 접속 → GitHub로 로그인
2. **New Project** → **Deploy from GitHub repo**
3. `oneiro-app` 저장소 선택
4. **Settings** → **Root Directory**를 `bot`으로 변경
5. **Variables** 탭에서 환경변수 추가:
   - `TELEGRAM_BOT_TOKEN`
   - `MINI_APP_URL`
   - `SUPABASE_FUNCTION_URL`
   - `SUPABASE_ANON_KEY`
6. **Deploy** 클릭

---

## 7단계: 최종 테스트

### 7-1. 봇 테스트

1. Telegram에서 봇 검색: `@ONEIROBot`
2. 봇과 대화 시작
3. `/start` 입력
4. "Start Dream Interpretation" 버튼 클릭
5. Mini App이 열리는지 확인

### 7-2. 기능 테스트

1. 꿈 입력 화면에서 꿈 내용 입력
2. "Interpret My Dream" 클릭
3. 로딩 화면 확인
4. 결과 화면 확인
5. 언어 변경 테스트
6. 공유 기능 테스트

---

## 🆘 문제 해결

### 문제: Supabase 함수 배포 실패
- **해결**: `supabase login` 다시 실행 후 재시도

### 문제: Vercel 빌드 실패
- **해결**: Vercel 대시보드에서 **Logs** 확인, 오류 메시지 확인

### 문제: Mini App이 열리지 않음
- **해결**: BotFather에서 `/setmenubutton` 다시 설정, URL 확인

### 문제: 봇이 응답하지 않음
- **해결**: 봇 서버가 실행 중인지 확인 (Railway/Render 대시보드 확인)

---

## 📝 체크리스트

배포 전 최종 확인:

- [ ] Supabase 프로젝트 생성 완료
- [ ] 데이터베이스 테이블 생성 완료
- [ ] Storage 버킷 생성 완료
- [ ] Edge Functions 5개 모두 배포 완료
- [ ] Edge Functions 환경변수 설정 완료
- [ ] Telegram 봇 생성 완료
- [ ] GitHub에 코드 업로드 완료
- [ ] Vercel 배포 완료
- [ ] Telegram Mini App URL 설정 완료
- [ ] 봇 서버 배포 완료 (또는 로컬 실행)
- [ ] 테스트 완료

---

## 🎉 완료!

모든 단계를 완료하셨다면 ONEIRO 봇이 정상적으로 작동할 것입니다!

추가 질문이 있으면 언제든 물어보세요!
