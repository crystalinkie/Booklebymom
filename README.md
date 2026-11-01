# Bookle

**Selected with mama's love** — 엄마 아빠가 직접 고른 연령별 영어 그림책과, 우리 아이 나이에 맞춘 엄마표 영어 가이드.

- 연령별 책장 (좌우로 넘기는 카드, 펼쳐서 자세히 보기, 같은 책은 카드 하나로)
- 좋아요 · 댓글 · 카톡 공유 · 프로필(등급 곰) · 우리 아이 곰 + 단계별 영어 가이드
- 책 등록: 알라딘·카카오 검색, 서점에서 바코드·표지 사진으로 찾기
- 로그인: 카카오 · Apple · 이메일 6자리 코드 (둘러보기는 로그인 없이)

기술: Vite + 바닐라 JS · Supabase(DB·로그인·사진) · Vercel(호스팅 + `/api` 서버 함수)

---

## 1. Supabase 준비 (15분)

1. https://supabase.com 에서 새 프로젝트 만들기 (지역: Northeast Asia (Seoul))
2. **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 Run
3. **Project Settings → API** 에서 `Project URL`, `anon public` 키 복사
4. **Authentication → URL Configuration**
   - Site URL: `https://bookle.my`
   - Redirect URLs: `https://bookle.my/**`, `https://www.bookle.my/**`, `https://*.vercel.app/**`, `http://localhost:5173/**`
5. **Authentication → Providers**
   - **Email**: 켜기. Email Templates → *Magic Link* 본문에 `{{ .Token }}`(6자리 코드)가 보이게 수정
     ```html
     <h2>Bookle 인증 코드</h2><p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
     ```
     기본 메일은 시간당 발송 수가 적어요. 파일럿 전에 *Project Settings → Auth → SMTP* 에 메일 서비스(예: Resend)를 연결하세요.
   - **Kakao**: 아래 2번에서 받은 REST API 키 / Client Secret 입력
   - **Apple**: 나중에 iOS 앱을 낼 때 필요 (웹에서는 선택)

## 2. 카카오 개발자 설정

https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가

- **카카오 로그인**: 활성화 ON, Redirect URI `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
- **보안**: Client Secret 생성 · 활성화 → Supabase Kakao Provider 에 입력
- **동의항목**: 닉네임, 프로필 사진
- **플랫폼 → Web**: 사이트 도메인 `https://bookle.my`, `https://www.bookle.my`, `http://localhost:5173`
- 앱 키: **REST API 키**(책 검색·로그인), **JavaScript 키**(카톡 공유)

## 3. Vercel 배포

1. 이 저장소를 Vercel 에 Import (Framework: **Vite**, 그대로 Deploy)
2. **Settings → Environment Variables** 에 `.env.example` 의 값을 모두 입력

| 이름 | 어디서 | 용도 |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase API | 앱 데이터·로그인 |
| `VITE_KAKAO_JS_KEY` | 카카오 JavaScript 키 | 카톡 공유 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase API | 공유 링크 미리보기 |
| `ALADIN_TTB_KEY` | 알라딘 TTB | 책 검색·ISBN |
| `KAKAO_REST_API_KEY` | 카카오 REST 키 | 책 검색 보충 |
| `ANTHROPIC_API_KEY` | console.anthropic.com | 표지 사진 읽기 |

3. 환경 변수를 넣은 뒤 **Redeploy**
4. **Settings → Domains** 에 `bookle.my` 와 `www.bookle.my` 추가 → Vercel 이 알려주는 DNS 값을 도메인 구입처에 입력
   - `bookle.my` (루트): **A 레코드** → `76.76.21.21`
   - `www`: **CNAME** → `cname.vercel-dns.com`
   - 몇 분~몇 시간 뒤 연결되고, HTTPS 인증서는 Vercel 이 자동으로 붙여요. (값은 Vercel 화면에 나오는 것이 우선이에요)

Supabase 값이 없으면 앱은 **미리보기 모드**(저장 안 됨, 예시 책만)로 열려요.

## 4. 내가 큐레이션한 책 한꺼번에 올리기 (구글 시트)

`tools/google-sheet-sync.gs` 를 구글 시트 Apps Script 에 붙여넣으면, 시트 메뉴 **북클 → 앱에 반영하기** 로 책이 올라가요.
스크립트 속성: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`(service_role), `CURATOR_USER_ID`(내 계정 UID), `ALADIN_TTB_KEY`, `KAKAO_REST_API_KEY`(선택).
시트는 나만 편집할 수 있게 두세요(service_role 키가 들어가요).

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:5173
```
`/api` 함수까지 로컬에서 쓰려면 `npx vercel dev`.

## 폴더

```
index.html            앱 뼈대
src/main.js           화면 (홈 · 책장 · 상세 · 프로필 · 가이드 · 시트들)
src/backend.js        Supabase 읽기·쓰기·로그인·실시간
src/styles.css        Bookle 디자인 (월넛 · 크림)
api/book-search.js    알라딘 → 카카오 책 검색 (?q= / ?isbn=)
api/read-cover.js     표지 사진 → 제목·작가 (Claude 비전)
api/og-book.js        /book/:id 공유 미리보기
supabase/schema.sql   테이블 · 권한(RLS) · 사진 저장소 · 실시간
tools/google-sheet-sync.gs  구글 시트 → 책 일괄 등록
```

## 데이터 구조 메모

- `books` 한 줄 = 한 사람의 추천 한 건. 화면은 같은 ISBN(없으면 제목)을 카드 하나로 묶고, 평점은 평균, "이웃들의 추천"에 각 추천을 보여줘요.
- 등급 곰: 등록한 추천 수 — Oak 1 · Bronze 10 · Silver 20 · Gold 30 · Diamond 50 (`TIERS`)
- 우리 아이 곰 6단계와 가이드 내용: `STAGES`, `STAGE_PLUS` (연구 근거 링크 포함)
