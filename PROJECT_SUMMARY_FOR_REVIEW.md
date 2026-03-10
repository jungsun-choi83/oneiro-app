# ONEIRO — 프로젝트 요약 (배포·수익성 검토용)

> 이 문서는 제미나이(Gemini) 또는 클로드(Claude)에게 "배포용으로 내용이 충분한지, 수익성이 있는지 검토해 달라"고 요청할 때 붙여넣기 위한 요약입니다.

---

## 1. 서비스 개요

- **이름**: ONEIRO (오네이로)
- **형태**: 텔레그램 미니앱 (Web App)
- **한 줄 설명**: 꿈 내용을 입력하면 AI가 융 심리학·동양 해몽·영적 관점을 결합해 해석해 주는 서비스. 무료로 요약을 보고, 유료(Telegram Stars)로 전체 해몽·꿈 시각화·영혼 리포트를 이용.

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18, Vite 7, TypeScript, Tailwind CSS, Zustand, react-i18next |
| 배포 | Vercel (프론트), Supabase (DB·Edge Functions) |
| AI | OpenAI GPT-4o-mini (Supabase Edge Function에서 호출) |
| 결제 | Telegram Stars (봇 API createInvoice), Supabase Edge Function `create-invoice` |
| 다국어 | en, ko, ja, es, ar (i18n + API 요청 시 language 파라미터) |

---

## 3. 사용자 플로우 (로직)

1. **홈(Home)**  
   - 앱 진입. 꿈 해몽 시작 → DreamInput으로 이동.

2. **꿈 입력(DreamInput)**  
   - 꿈 내용 입력(최소 20자), 기분 태그(무서운·평화로운 등), 반복 꿈 여부 선택.  
   - **언어 선택**: 여기서 선택한 언어로 해몽 결과가 생성됨(API에 전달).  
   - 제출 시 `setInterpretLanguage`, `navigate('/loading', { state: { requestLanguage } })`.

3. **로딩(Loading)**  
   - Supabase Edge Function `interpret-dream` 호출 (fetch, POST).  
   - 전달: `dreamText`, `mood`, `isRecurring`, `telegramUserId`, `language`.  
   - 성공 시 해몽 결과(JSON)를 Zustand `dreamResult`에 저장, `/result`로 이동.  
   - 실패 시 동일한 mock 데이터로 폴백 후 `/result` 이동.  
   - Edge Function: OpenAI로 위 내용 기반 해몽 생성, DB(dreams 테이블) 저장 후 JSON 반환.

4. **결과(Result)**  
   - **무료**: Hidden Meaning(한 문장), Essence, Key Symbols 등 일부만 노출.  
   - **유료(잠금 해제)**: 전체 해몽(deepInsight, psychologicalShadow, easternProphecy, spiritualAdvice, advice, spiritualMessage) 노출.  
   - **결제**: "전체 해몽 잠금 해제 — 50 Stars" 버튼 → Supabase `create-invoice` 호출(product: `full_reading`, 50 Stars) → Telegram `openInvoice`로 결제 창 → 결제 완료 시 `unlocked` 처리.  
   - 기타: 공유(Share), 꿈 일기 저장(Save), 추천(Referral) — 친구 3명 초대 시 무료 전체 해몽 등.

5. **꿈 시각화(Visualize)**  
   - 유료 상품(`dream_visualizer`, 150 Stars). 결제 후 DALL·E 등으로 꿈 이미지 생성(구현에 따라 연동).

6. **영혼 리포트(Report)**  
   - 유료 상품(`soul_report`). 결제 후 리포트 화면 표시.

7. **꿈 일기(Journal)**  
   - 로컬(Zustand persist)에 저장한 해몽 목록 조회.

8. **리퍼럴(Referral)**  
   - 친구 초대 시 무료 전체 해몽 등 인센티브(구현 세부에 따라 다름).

---

## 4. 수익 구조

- **Telegram Stars** 기반 인앱 결제.  
- **상품·가격(예시)**  
  - 전체 해몽 잠금 해제: **50 Stars**  
  - 꿈 시각화: **150 Stars**  
  - 영혼 리포트: (구현 시 별도 Stars)  
- Stars는 텔레그램이 정한 비율로 정산(예: 1 Star = 일정 금액).  
- **무료 사용**: 요약·일부만 제공 → 유료 전환 유도.

---

## 5. 인프라·설정 요약

- **Vercel**:  
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 환경 변수로 Supabase 연동.  
- **Supabase**:  
  - Edge Functions: `interpret-dream`(OpenAI 호출, DB 저장), `create-invoice`(Telegram createInvoice).  
  - Secrets: `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등.  
- **텔레그램 봇**:  
  - BotFather에서 Web App URL을 Vercel 배포 URL(예: `https://oneiro-app-jxuu.vercel.app`)로 설정.

---

## 6. 현재 구현 상태(요약)

- ✅ 꿈 입력 → API 해몽 → 결과 표시(무료/유료 구분).  
- ✅ 다국어(UI + 해몽 언어).  
- ✅ Telegram Stars 결제 연동(create-invoice, openInvoice).  
- ✅ 꿈 일기 저장(로컬).  
- ✅ 리퍼럴·공유·시각화/리포트 화면(유료 진입점).  
- ✅ 디버그 패널 제거(일반 사용자에게 미노출).  
- ⚠️ 꿈 시각화·영혼 리포트의 실제 AI/이미지 생성 파이프라인은 프로젝트 내 구현 정도에 따라 상이할 수 있음.

---

## 7. 검토 요청 사항 (제미나이/클로드에게 전달할 문장)

아래 문장을 그대로 복사해 붙여넣으면 됩니다.

---

**"[위 ONEIRO 프로젝트 요약을 읽고 다음을 검토해 주세요.]**

1. **배포 관점**:  
   - 기술 스택·플로우·인프라 설정만 놓고 봤을 때, 실제 서비스 배포(텔레그램 미니앱 + Vercel + Supabase)에 필요한 내용이 문서만으로도 충분히 전달되는지,  
   - 빠진 부분(보안, 에러 처리, 규모 확장 등)이 있다면 무엇인지 짚어 주세요.

2. **수익성 관점**:  
   - Telegram Stars 기반 유료 해몽(50 Stars)·꿈 시각화(150 Stars)·리포트 등 수익 구조가,  
   - 사용자 경험(무료 체험 → 유료 전환)과 비용(OpenAI API, 인프라) 대비 현실적으로 수익 가능성이 있는지,  
   - 개선하면 좋은 점(가격, 상품 구성, 전환 유도 등)을 구체적으로 제안해 주세요."**

---

*이 문서는 ONEIRO 프로젝트의 로직·구조·수익 모델을 요약한 것이며, 제미나이/클로드에게 배포 적합성과 수익성을 검토받기 위한 입력 자료입니다.*
