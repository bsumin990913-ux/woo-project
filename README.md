# Works — 나만의 링크트리

작업 중인 프로젝트를 **폴더**로 나눠 모아 두고, 폴더마다 독립된 공개 페이지를 갖는 링크 허브입니다.

- **관리자 화면** `/admin` — 폴더 만들기, 링크 등록, 글 작성, 순서 변경, 공개/비공개 전환
- **방문자 화면** `/`, `/폴더주소`, `/폴더주소/글ID` — 로그인 없이 누구나 볼 수 있는 페이지

| 구분 | 담고 있는 것 |
| --- | --- |
| 폴더 | 폴더명, 한 줄 설명, 썸네일, 링크 여러 개(인스타·유튜브·틱톡 등), 소개글 |
| 글 | 제목, 링크 여러 개, 사진 여러 장, 소개 |

기술 스택: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Storage)

---

## 1. Supabase 준비 (최초 1회)

1. [supabase.com](https://supabase.com) 에서 프로젝트를 만듭니다. (무료 플랜으로 충분)
2. 좌측 **SQL Editor** 를 열고 [`supabase/schema.sql`](supabase/schema.sql) 내용을 통째로 붙여넣은 뒤 **Run**.
   → 테이블 2개(`folders`, `posts`)와 이미지 저장용 `media` 버킷이 만들어집니다.
3. 값 3개를 복사합니다. Supabase 가 최근 키 이름을 바꿔서 **프로젝트 생성 시기에 따라 화면이 다릅니다.**

   **주소 + 공개 키** — 프로젝트 화면 위쪽 초록색 **Connect** 버튼 → **App Frameworks** 탭 → **Next.js**
   여기에 `NEXT_PUBLIC_SUPABASE_URL` 과 공개 키가 복사할 수 있게 나옵니다.

   **비밀 키** — 좌측 하단 톱니바퀴(**Project Settings**) → **API Keys**
   - `Secret keys` 항목의 값 (`sb_secret_…`) — 없으면 **Legacy API Keys** 탭의 `service_role` 값
   - ⚠️ 이건 **절대 외부에 공개하면 안 되는 키**입니다. GitHub 에도 올라가지 않습니다.

## 2. 로컬에서 실행

```bash
npm install
```

프로젝트 폴더에 있는 **`.env.local` 파일을 메모장이나 편집기로 열어** 값을 채웁니다.
(따로 만들 필요 없이 이미 들어 있고, git 에는 올라가지 않습니다. 파일 안에 어디서 복사하는지도 적어 뒀습니다)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   ← 또는 예전 anon key
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...            ← 또는 예전 service_role key
ADMIN_PASSWORD=원하는-비밀번호
AUTH_SECRET=길고-랜덤한-아무-문자열
```

> 새 이름(`sb_publishable_…` / `sb_secret_…`)과 예전 이름(`anon` / `service_role`) **둘 다 그대로 넣으면 동작합니다.**
> `ADMIN_PASSWORD` 는 지금 `woo1234` 로 들어 있습니다. **반드시 바꾸세요.**
> `AUTH_SECRET` 은 로그인 쿠키 위조를 막는 값이라 길수록 좋습니다.

```bash
npm run dev
```

- 방문자 화면: http://localhost:3000
- 관리자 화면: http://localhost:3000/admin (비밀번호 입력)

환경변수를 바꾸면 **개발 서버를 껐다 켜야** 반영됩니다.

## 3. GitHub + Vercel 배포

```bash
git init
git add .
git commit -m "링크 허브 초기 구성"
git branch -M main
git remote add origin https://github.com/<본인계정>/<저장소이름>.git
git push -u origin main
```

그다음 [vercel.com](https://vercel.com) 에서 **Add New → Project → 방금 만든 저장소 선택**.

배포 전에 **Environment Variables** 에 위 5개를 그대로 등록하세요.

| 이름 | 비고 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 |
| `ADMIN_PASSWORD` | 🔒 |
| `AUTH_SECRET` | 🔒 |

빌드 설정은 건드릴 필요 없습니다(Next.js 자동 인식). 이후 `git push` 할 때마다 자동 재배포됩니다.

---

## 쓰는 법

**폴더 만들기** — `/admin` → `+ 새 폴더`
공개 주소(슬러그)는 폴더명에서 자동으로 만들어지고, 직접 고칠 수도 있습니다. 저장하면 `/그-주소` 가 바로 그 폴더의 공개 페이지가 됩니다.

**링크 추가** — 주소만 붙여넣으면 인스타·유튜브·틱톡·X·깃허브 등을 알아서 인식해 아이콘과 색을 붙입니다. `instagram.com/...` 처럼 `https://` 를 빼고 써도 됩니다. 표시 이름을 비워 두면 플랫폼 이름이 자동으로 들어갑니다.

**글 쓰기** — 폴더 관리 화면 아래쪽 `+ 새 글`
사진은 여러 장 올릴 수 있고, **첫 번째 사진이 목록의 대표 이미지**가 됩니다. 사진 위에 마우스를 올리면 순서 변경(← →)과 삭제 버튼이 나옵니다.

**순서 바꾸기** — 목록 왼쪽의 ↑ ↓ 버튼. 방문자 화면에도 그대로 반영됩니다.

**비공개** — `공개하기` 체크를 끄면 목록과 페이지에서 사라집니다. 데이터베이스 정책(RLS) 수준에서 막히므로 주소를 알아도 볼 수 없습니다.

## 알아둘 점

- 글 삭제 시 그 글의 사진도 Supabase Storage 에서 함께 지워집니다. 폴더를 지우면 안의 글과 사진이 전부 사라집니다.
- 이미지는 장당 최대 10MB, jpg/png/webp/gif/avif 를 지원합니다.
- 공개 페이지는 60초 단위로 캐시되지만, 대시보드에서 저장하면 즉시 갱신됩니다.
- 관리자 인증은 비밀번호 1개 + 서명된 쿠키(30일) 방식입니다. 비밀번호를 바꾸면 기존 로그인 세션이 모두 무효화됩니다.

## 구조

```
app/
  page.tsx                     전체 폴더 목록 (방문자)
  [slug]/page.tsx              폴더 공개 페이지
  [slug]/[postId]/page.tsx     글 상세 페이지
  login/page.tsx               관리자 로그인
  admin/                       대시보드 (로그인 필수)
  api/upload/route.ts          이미지 업로드
components/                    폼·에디터·갤러리 등 UI
lib/
  actions.ts                   서버 액션 (저장/삭제/정렬)
  queries.ts                   데이터 조회
  auth.ts                      비밀번호 로그인 · 쿠키 서명
  platform.ts                  URL → 플랫폼 자동 인식
supabase/schema.sql            DB 스키마 (최초 1회 실행)
```
