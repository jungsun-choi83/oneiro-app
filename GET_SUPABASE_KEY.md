# Supabase Anon Key 확인 방법

## 1단계: Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. `oneiro` 프로젝트 선택

## 2단계: Anon Key 복사

1. **Settings** → **API** 클릭
2. **Project API keys** 섹션에서
3. **anon public** 키 복사 (긴 문자열)

## 3단계: 코드에 추가

`src/lib/supabase.ts` 파일을 열고:

```typescript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '여기에복사한키붙여넣기'
```

`'여기에실제AnonKey를입력하세요'` 부분을 실제 Anon Key로 교체하세요.

## 4단계: 재배포

코드 수정 후:
1. GitHub에 push (또는 Vercel CLI로 배포)
2. Vercel이 자동으로 재배포합니다

---

**참고:** 이 방법은 환경 변수가 작동하지 않을 때 임시로 사용하는 방법입니다. 
환경 변수가 정상 작동하면 환경 변수를 우선 사용하고, 없을 때만 fallback을 사용합니다.
