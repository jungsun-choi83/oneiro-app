# 🚀 ONEIRO 빠른 시작 가이드

## 필수 준비물

1. ✅ Supabase 계정 (무료)
2. ✅ Vercel 계정 (무료)  
3. ✅ OpenAI API 키 (유료)
4. ✅ Telegram 봇 토큰

---

## 1️⃣ Supabase 설정 (10분)

### Step 1: 프로젝트 생성
1. https://supabase.com → 가입 → New Project
2. 프로젝트 이름: `oneiro`
3. 비밀번호 저장해두기!

### Step 2: API 키 확인
Settings → API에서 복사:
- Project URL
- anon key
- service_role key

### Step 3: 데이터베이스 생성
SQL Editor → New query → 아래 코드 붙여넣기 → RUN

```sql
-- 전체 SQL 코드는 DEPLOYMENT_GUIDE.md 참고
```

### Step 4: Storage 생성
Storage → Create bucket → 이름: `dream-images` → Public 체크

---

## 2️⃣ Edge Functions 배포 (15분)

### Step 1: Supabase CLI 설치
Windows: https://github.com/supabase/cli/releases 에서 다운로드

### Step 2: 로그인 및 연결
```powershell
supabase login
supabase link --project-ref [프로젝트ID]
```

### Step 3: 함수 배포
```powershell
supabase functions deploy interpret-dream
supabase functions deploy visualize-dream
supabase functions deploy daily-symbol
supabase functions deploy create-invoice
supabase functions deploy handle-referral
```

### Step 4: 환경변수 설정
각 함수의 Settings → Secrets에서:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN` (create-invoice만)

---

## 3️⃣ Telegram 봇 생성 (5분)

1. Telegram에서 `@BotFather` 검색
2. `/newbot` 입력
3. 봇 이름: `ONEIRO Bot`
4. 사용자명: `ONEIROBot`
5. 토큰 저장!

---

## 4️⃣ Vercel 배포 (10분)

### Step 1: GitHub 업로드
1. GitHub에 새 저장소 생성
2. 코드 업로드 (GitHub Desktop 사용 추천)

### Step 2: Vercel 배포
1. https://vercel.com → GitHub 로그인
2. Import Project → 저장소 선택
3. Environment Variables 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Step 3: Mini App 설정
BotFather에서:
```
/setmenubutton
ONEIROBot
Start Dream Interpretation
[Vercel URL]
```

---

## 5️⃣ 봇 서버 실행 (선택)

### 로컬 실행:
```powershell
cd bot
npm install
# .env 파일 생성 후
npm start
```

### 또는 Railway/Render에 배포 (24시간 실행)

---

## ✅ 테스트

1. Telegram에서 `@ONEIROBot` 검색
2. `/start` 입력
3. Mini App 버튼 클릭
4. 꿈 입력 → 해몽 확인!

---

## 📞 문제 발생 시

1. **Supabase 함수 오류**: Logs 탭에서 확인
2. **Vercel 빌드 실패**: Build Logs 확인
3. **봇 응답 없음**: 봇 서버 실행 확인

자세한 내용은 `DEPLOYMENT_GUIDE.md` 참고!
