# 🔍 문제 진단 체크리스트

환경 변수가 설정되어 있는데도 작동하지 않을 때 확인할 사항들입니다.

## ✅ 1단계: Vercel 환경 변수 확인 (중요!)

### 확인 방법:
1. https://vercel.com/dashboard 접속
2. `oneiro83app` 프로젝트 클릭
3. **Settings** → **Environment Variables** 클릭
4. 다음을 확인:

**확인 사항:**
- [ ] `VITE_SUPABASE_URL`이 **Production**, **Preview**, **Development** 모두에 설정되어 있음
- [ ] `VITE_SUPABASE_ANON_KEY`가 **Production**, **Preview**, **Development** 모두에 설정되어 있음
- [ ] 값이 정확함:
  - `VITE_SUPABASE_URL` = `https://qjcjrnogkhaiewoqjrns.supabase.co` (끝에 `/` 없음)
  - `VITE_SUPABASE_ANON_KEY` = (긴 문자열, 공백 없음)

**⚠️ 중요:** 환경 변수를 추가/수정한 후에는 **반드시 재배포**해야 합니다!

---

## ✅ 2단계: 재배포 확인

환경 변수를 추가/수정한 후:

1. **Deployments** 탭 클릭
2. 최신 배포의 **생성 시간** 확인
3. 환경 변수를 수정한 **이후**에 배포가 되었는지 확인
4. 환경 변수 수정 후 배포가 안 되었다면:
   - 최신 배포 옆 **"..."** 메뉴 클릭
   - **Redeploy** 클릭
   - **Redeploy** 확인

**⚠️ 중요:** 환경 변수는 빌드 타임에 포함되므로, 환경 변수 추가 후 **새로운 빌드**가 필요합니다!

---

## ✅ 3단계: 실제 배포된 버전 확인

### 브라우저에서 확인:

1. 배포된 URL 접속 (예: `https://oneiro83app-xxx.vercel.app`)
2. **F12**로 개발자 도구 열기
3. **Console** 탭 확인
4. 다음 메시지 확인:

**정상인 경우:**
```
🚀 [ONEIRO] ========== 꿈 해석 시작 ==========
🔍 [ONEIRO] 환경 변수 상태: {
  VITE_SUPABASE_URL: "https://qjcjrnogkhaiewoqjrns.supabase.co...",
  VITE_SUPABASE_ANON_KEY: "있음 (길이: 100+)",
  ...
}
✅ [ONEIRO] 실제 API 호출 시도
✅ [ONEIRO] API 호출 성공!
```

**문제인 경우:**
```
🚀 [ONEIRO] ========== 꿈 해석 시작 ==========
🔍 [ONEIRO] 환경 변수 상태: {
  VITE_SUPABASE_URL: "❌ 없음",
  VITE_SUPABASE_ANON_KEY: "❌ 없음",
  ...
}
❌ [ONEIRO] Supabase 환경 변수 미설정
📝 [ONEIRO] Mock 데이터 사용 (항상 같은 해석)
```

**해결:** 환경 변수가 빌드에 포함되지 않았습니다. 재배포 필요!

---

## ✅ 4단계: 브라우저 캐시 문제 해결

브라우저가 이전 버전을 캐시하고 있을 수 있습니다.

### 해결 방법:
1. **시크릿/프라이빗 창**에서 테스트
2. 또는 **Ctrl + Shift + Delete** → 캐시 삭제
3. 또는 **Ctrl + F5** (강제 새로고침)

---

## ✅ 5단계: 결제 문제 확인

### 확인 사항:

1. **봇 서버 실행 여부:**
   - Railway/Render에 배포되어 있나요?
   - 또는 로컬에서 실행 중인가요?
   - 봇 서버가 없으면 결제가 작동하지 않습니다!

2. **Supabase Edge Function 확인:**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택
   - **Edge Functions** → `create-invoice` 클릭
   - **Settings** → **Secrets** 탭
   - `TELEGRAM_BOT_TOKEN`이 있는지 확인 ✅ (이미 있음)

3. **결제 시도 시 콘솔 확인:**
   - 결제 버튼 클릭
   - F12 → Console 탭 확인
   - 에러 메시지 확인:
     - `[ONEIRO] Payment error: ...` → 에러 내용 확인
     - `PAYMENT_UNSUPPORTED` → 텔레그램 앱 업데이트 필요
     - `Invalid transaction details` → 봇 서버 문제 가능성

---

## 🔧 해결 방법

### 해몽 결과가 연결 안 되는 경우:

1. **Vercel 대시보드에서 환경 변수 확인**
2. **환경 변수가 Production, Preview, Development 모두에 설정되어 있는지 확인**
3. **환경 변수 수정 후 반드시 재배포**
4. **브라우저 캐시 삭제 후 다시 테스트**

### 결제가 안 되는 경우:

1. **봇 서버 실행 확인:**
   - Railway/Render에 배포되어 있나요?
   - 또는 로컬에서 실행 중인가요?

2. **로컬에서 봇 서버 실행 (테스트용):**

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO\bot"

# .env 파일 생성 (메모장으로)
# 내용:
TELEGRAM_BOT_TOKEN=봇토큰
MINI_APP_URL=https://oneiro83app-xxx.vercel.app
SUPABASE_FUNCTION_URL=https://qjcjrnogkhaiewoqjrns.supabase.co/functions/v1
SUPABASE_ANON_KEY=anon키

npm install
npm start
```

3. **봇 서버가 실행되면 결제가 작동합니다!**

---

## 📋 최종 체크리스트

- [ ] Vercel 환경 변수가 **Production, Preview, Development 모두**에 설정됨
- [ ] 환경 변수 수정 후 **재배포** 완료
- [ ] 브라우저 **시크릿/프라이빗 창**에서 테스트
- [ ] 브라우저 콘솔에서 `✅ [ONEIRO] 실제 API 호출 시도` 메시지 확인
- [ ] 봇 서버가 **실행 중** (결제용)
- [ ] Supabase Edge Function `create-invoice`에 `TELEGRAM_BOT_TOKEN` 설정됨

---

## 🆘 여전히 안 되면

1. **Vercel 대시보드** → **Deployments** → 최신 배포의 **Build Logs** 확인
2. 빌드 로그에서 환경 변수 관련 에러 확인
3. 브라우저 콘솔의 **전체 에러 메시지** 캡처해서 공유
