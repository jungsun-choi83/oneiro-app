# 배포 문제 해결 가이드

## 🔴 현재 문제: Root Directory 오류

**에러 메시지:** `The specified Root Directory ".\" does not exist`

## ✅ 해결 방법 1: Vercel 대시보드에서 직접 수정 (가장 확실)

### 1단계: Vercel 대시보드 접속
1. https://vercel.com/dashboard 접속
2. `oneiro83app` 프로젝트 클릭

### 2단계: Root Directory 설정 수정
1. **Settings** → **General** 클릭
2. **Root Directory** 섹션 찾기
3. **Root Directory 필드를 완전히 비우기** (아무것도 입력하지 않음)
4. **Save** 클릭

### 3단계: 환경 변수 확인
1. **Settings** → **Environment Variables** 클릭
2. 다음이 있는지 확인:
   - `VITE_SUPABASE_URL` = `https://qjcjrnogkhaiewoqjrns.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (Supabase Anon Key)
3. 없으면 추가:
   - **Add New** 클릭
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://qjcjrnogkhaiewoqjrns.supabase.co`
   - Environments: Production, Preview, Development 모두 선택
   - **Save**
   - 다시 **Add New** 클릭
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (Supabase Anon Key)
   - Environments: Production, Preview, Development 모두 선택
   - **Save**

### 4단계: 재배포
1. **Deployments** 탭 클릭
2. 최신 배포 옆 **"..."** 메뉴 클릭
3. **Redeploy** 클릭
4. **Redeploy** 확인

---

## ✅ 해결 방법 2: GitHub를 통한 자동 배포 (권장)

CLI 오류를 피하고 자동 배포를 사용하세요.

### 1단계: GitHub에 코드 업로드

**터미널에서:**

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"

# Git 초기화 (이미 되어있으면 스킵)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit"

# 브랜치 이름 변경
git branch -M main

# GitHub 저장소 연결 (GitHub에서 저장소 먼저 만들어야 함)
git remote add origin https://github.com/[당신의GitHub사용자명]/oneiro-app.git

# 업로드
git push -u origin main
```

**또는 GitHub Desktop 사용:**
1. https://desktop.github.com 다운로드
2. GitHub Desktop 실행 → GitHub 로그인
3. **File** → **Add Local Repository**
4. `C:\Users\choi jungsun\Desktop\ONEIRO` 선택
5. 커밋 메시지: `Initial commit`
6. **Commit to main** 클릭
7. **Publish repository** 클릭

### 2단계: Vercel에서 GitHub 저장소 연결

1. https://vercel.com/dashboard 접속
2. **Add New** → **Project** 클릭
3. **Import Git Repository** 클릭
4. GitHub 저장소 선택: `oneiro-app`
5. **Import** 클릭

### 3단계: 프로젝트 설정

1. **Framework Preset**: `Vite` 선택
2. **Root Directory**: 비워두기 (기본값)
3. **Build Command**: `npm run build` (자동 감지됨)
4. **Output Directory**: `dist` (자동 감지됨)

### 4단계: 환경 변수 설정

**Environment Variables** 섹션에서:
- `VITE_SUPABASE_URL` = `https://qjcjrnogkhaiewoqjrns.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (Supabase Anon Key)

각각:
- **Add** 클릭
- Name 입력
- Value 입력
- **Production**, **Preview**, **Development** 모두 선택
- **Save**

### 5단계: 배포

**Deploy** 클릭 → 자동으로 배포 시작!

### 6단계: 자동 배포 설정

이제부터는:
- 코드 수정 → GitHub에 push → Vercel이 자동으로 재배포
- CLI 사용 불필요!

---

## 🔧 해몽 결과가 연결 안 되는 문제 해결

### 원인: 환경 변수가 설정되지 않음

### 해결:
1. Vercel 대시보드 → **Settings** → **Environment Variables** 확인
2. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 있는지 확인
3. 없으면 위의 "해결 방법 1"의 3단계 참고
4. 환경 변수 추가 후 **재배포** 필수!

### 확인 방법:
1. 배포된 URL 접속
2. F12로 개발자 도구 열기
3. Console 탭 확인
4. `✅ [ONEIRO] 실제 API 호출 시도` 메시지가 보이면 정상
5. `❌ [ONEIRO] Mock 데이터 사용` 메시지가 보이면 환경 변수 문제

---

## 💳 결제가 안 되는 문제 해결

### 원인 1: 봇 서버가 실행되지 않음

**해결:**
1. Railway 또는 Render에 봇 서버 배포 (24시간 실행)
2. 또는 로컬에서 봇 서버 실행

**로컬 실행 방법:**

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO\bot"

# .env 파일 생성 (메모장으로)
# 내용:
# TELEGRAM_BOT_TOKEN=봇토큰
# MINI_APP_URL=https://oneiro83app-xxx.vercel.app
# SUPABASE_FUNCTION_URL=https://qjcjrnogkhaiewoqjrns.supabase.co/functions/v1
# SUPABASE_ANON_KEY=anon키

npm install
npm start
```

### 원인 2: Supabase Edge Function에 TELEGRAM_BOT_TOKEN이 없음

**해결:**
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. **Edge Functions** → `create-invoice` 함수 클릭
4. **Settings** → **Secrets** 탭
5. `TELEGRAM_BOT_TOKEN` 추가
6. Value: 봇 토큰 입력
7. **Save**

### 원인 3: 텔레그램 앱 버전이 오래됨

**해결:**
- 텔레그램 앱을 최신 버전으로 업데이트
- "PAYMENT_UNSUPPORTED" 에러가 나오면 앱 업데이트 필요

---

## 📋 체크리스트

배포 전 확인:
- [ ] Vercel 대시보드에서 Root Directory가 비어있음
- [ ] `VITE_SUPABASE_URL` 환경 변수 설정됨
- [ ] `VITE_SUPABASE_ANON_KEY` 환경 변수 설정됨
- [ ] Supabase Edge Function `create-invoice`에 `TELEGRAM_BOT_TOKEN` 설정됨
- [ ] 봇 서버가 실행 중이거나 Railway/Render에 배포됨

배포 후 확인:
- [ ] 배포 URL 접속 가능
- [ ] 브라우저 콘솔에서 `✅ [ONEIRO] 실제 API 호출 시도` 메시지 확인
- [ ] 꿈 입력 시 다른 해석이 나옴 (Mock 데이터가 아님)
- [ ] 결제 버튼 클릭 시 결제 창이 열림

---

## 🆘 여전히 안 되면

1. **Vercel 대시보드에서 직접 수정** (가장 확실)
2. **GitHub를 통한 자동 배포 사용** (CLI 오류 회피)
3. **브라우저 캐시 삭제** 후 다시 테스트
4. **시크릿/프라이빗 창**에서 테스트
