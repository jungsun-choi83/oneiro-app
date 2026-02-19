# Vercel CLI로 직접 배포하기 (GitHub 없이)

## 1단계: Vercel CLI 설치

PowerShell에서 실행:

```powershell
npm install -g vercel
```

## 2단계: Vercel 로그인

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
vercel login
```

브라우저가 열리면 Vercel 계정으로 로그인하세요.

## 3단계: 프로젝트 배포

### 처음 배포하는 경우:

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
vercel
```

질문이 나오면:
- **Set up and deploy?** → `Y` 입력
- **Which scope?** → 본인 계정 선택
- **Link to existing project?** → `N` 입력 (처음이면)
- **What's your project's name?** → `oneiro-app` 입력 (또는 원하는 이름)
- **In which directory is your code located?** → `./` 입력 (현재 디렉토리)
- **Want to override the settings?** → `N` 입력

### 환경 변수 설정:

배포 후 Vercel 대시보드에서 환경 변수를 설정하거나, 명령어로 설정:

```powershell
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

각각 입력할 때:
- **What's the value of VITE_SUPABASE_URL?** → Supabase URL 입력
- **What's the value of VITE_SUPABASE_ANON_KEY?** → Supabase Anon Key 입력
- **Add VITE_SUPABASE_URL to which Environments?** → `Production`, `Preview`, `Development` 모두 선택

### 재배포 (환경 변수 설정 후):

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
vercel --prod
```

## 4단계: 코드 변경 후 재배포

코드를 수정한 후:

```powershell
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
vercel --prod
```

## 전체 명령어 요약

```powershell
# 1. Vercel CLI 설치 (한 번만)
npm install -g vercel

# 2. 로그인 (한 번만)
cd "C:\Users\choi jungsun\Desktop\ONEIRO"
vercel login

# 3. 처음 배포
vercel

# 4. 환경 변수 설정 (한 번만)
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# 5. 코드 변경 후 재배포
vercel --prod
```

## 참고사항

- `vercel` (프로덕션 배포 없이) → Preview 배포 (테스트용)
- `vercel --prod` → 프로덕션 배포 (실제 사용자에게 보이는 버전)
- 환경 변수는 Vercel 대시보드에서도 설정 가능합니다: https://vercel.com/dashboard
