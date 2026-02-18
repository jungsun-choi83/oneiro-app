# ✅ ONEIRO 배포 체크리스트

각 항목을 완료하면 체크하세요!

## 📋 사전 준비

- [ ] Supabase 계정 생성 완료
- [ ] Vercel 계정 생성 완료
- [ ] GitHub 계정 생성 완료
- [ ] OpenAI API 키 발급 완료
- [ ] Telegram 계정 준비 완료

---

## 1️⃣ Supabase 설정

- [ ] 프로젝트 생성 완료
- [ ] Project URL 복사 완료
- [ ] anon key 복사 완료
- [ ] service_role key 복사 완료 (비밀!)
- [ ] SQL 마이그레이션 실행 완료
- [ ] Storage 버킷 `dream-images` 생성 완료
- [ ] Storage 정책 설정 완료

---

## 2️⃣ Edge Functions 배포

- [ ] Supabase CLI 설치 완료
- [ ] `supabase login` 완료
- [ ] `supabase link` 완료
- [ ] `interpret-dream` 함수 배포 완료
- [ ] `visualize-dream` 함수 배포 완료
- [ ] `daily-symbol` 함수 배포 완료
- [ ] `create-invoice` 함수 배포 완료
- [ ] `handle-referral` 함수 배포 완료
- [ ] 모든 함수의 환경변수 설정 완료

**환경변수 확인:**
- [ ] `OPENAI_API_KEY` 설정됨
- [ ] `SUPABASE_URL` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨
- [ ] `TELEGRAM_BOT_TOKEN` 설정됨 (create-invoice만)

---

## 3️⃣ Telegram 봇 설정

- [ ] BotFather에서 봇 생성 완료
- [ ] 봇 토큰 저장 완료
- [ ] 봇 설명 설정 완료 (`/setdescription`)
- [ ] 봇 소개 설정 완료 (`/setabouttext`)
- [ ] Mini App URL 설정 완료 (`/setmenubutton`)

---

## 4️⃣ 프론트엔드 배포 (Vercel)

- [ ] GitHub에 코드 업로드 완료
- [ ] Vercel 프로젝트 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] 환경변수 설정 완료:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] 배포 완료
- [ ] 배포 URL 확인 완료

---

## 5️⃣ 봇 서버 설정

**로컬 실행 선택 시:**
- [ ] `bot` 폴더로 이동 완료
- [ ] `npm install` 완료
- [ ] `.env` 파일 생성 완료
- [ ] 환경변수 입력 완료
- [ ] `npm start` 실행 완료

**또는 Railway/Render 배포 선택 시:**
- [ ] Railway/Render 계정 생성 완료
- [ ] 프로젝트 생성 완료
- [ ] GitHub 저장소 연결 완료
- [ ] Root Directory를 `bot`으로 설정 완료
- [ ] 환경변수 설정 완료
- [ ] 배포 완료

---

## 6️⃣ 최종 테스트

- [ ] Telegram에서 봇 검색 성공
- [ ] `/start` 명령어 작동 확인
- [ ] Mini App 버튼 클릭 시 앱 열림 확인
- [ ] 꿈 입력 화면 표시 확인
- [ ] 꿈 내용 입력 및 제출 확인
- [ ] 로딩 화면 표시 확인
- [ ] 결과 화면 표시 확인
- [ ] 언어 변경 기능 확인
- [ ] 공유 기능 확인
- [ ] Referral 시스템 확인

---

## 🎯 배포 완료!

모든 항목을 체크했다면 배포가 완료된 것입니다!

---

## 📝 중요 정보 백업

다음 정보를 안전한 곳에 저장하세요:

```
Supabase:
- Project URL: _______________________
- anon key: _______________________
- service_role key: _______________________

Telegram:
- 봇 토큰: _______________________

Vercel:
- 배포 URL: _______________________

OpenAI:
- API 키: _______________________
```

---

## 🆘 문제 발생 시

1. **Supabase 함수 오류**: Edge Functions → Logs 확인
2. **Vercel 빌드 실패**: Vercel 대시보드 → Deployments → Logs 확인
3. **봇 응답 없음**: 봇 서버 로그 확인
4. **Mini App 안 열림**: BotFather에서 `/setmenubutton` 재설정

자세한 내용은 `DEPLOYMENT_GUIDE.md` 참고!
