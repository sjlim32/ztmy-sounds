# 퀴즈 기능 설계서

- 작성일: 2026-09-04
- 관련 문서: [`docs/superpowers/plans/new-features.md`](../plans/new-features.md) (퀴즈+도감 초안) — 이 문서는 그중 **퀴즈 부분만** 구체화하고 일부를 정정한다. 도감은 범위 밖(별도 스펙).

## 1. 배경 및 제약

- 이 프로젝트는 `next.config.ts`의 `output: "export"`로 배포되는 **완전 정적 사이트**다. Next.js 서버 런타임이 없고, `wrangler pages deploy out`으로 정적 파일만 올라간다.
- 요구사항: 문제/정답이 브라우저에 노출되지 않아야 하고, 연습 문제와 실제 테스트(기기당 1회 제한)를 구분해야 한다.
- **정적 사이트에서 "굽는(bake) 데이터"는 전부 공개 데이터다.** 정적 export 시점에 데이터를 fetch해서 HTML/JS에 포함시키는 방식(초안 문서 5.2절의 웹훅 SSG 파이프라인)은 도감처럼 공개 콘텐츠엔 적합하지만, 퀴즈처럼 정답을 숨겨야 하는 데이터에는 **적용할 수 없다.** 이 문서에서 가장 먼저 정정하는 지점이 이것이다: **퀴즈 데이터는 빌드에 절대 포함되지 않고, 항상 런타임에 클라이언트가 Supabase를 호출해서 받아온다.**

## 2. 인프라

기존 초안(`new-features.md` 2절)의 하이브리드 구조를 그대로 따른다.

| 분류       | 스택                                                          | 역할                                           |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 프론트엔드 | Next.js (`output: export`) + Cloudflare Pages                 | 퀴즈 UI, 정적 페이지 서빙                      |
| DB & API   | Supabase (PostgreSQL, Auth, RPC)                              | 문제/정답/응시 기록 저장, 채점, 기기 중복 판정 |
| 어드민     | 같은 리포 `/admin` 라우트 + Supabase Auth + Cloudflare Access | 문제 CRUD, 응시 기록 조회/리셋                 |

어드민을 별도 리포/서브도메인으로 분리하지 않는다. `output: "export"`에서는 Next 서버가 없으므로 어차피 무거운 로직은 Supabase RPC/Edge Function이 담당하며, 리포 분리로 얻는 실익(배포 파이프라인 격리, 접근권한 격리)이 지금 시점(1인 운영, 문제 CRUD 수준)에는 비용보다 작다. 아래 조건 중 하나가 실제로 발생하면 그때 분리한다:

1. 여러 명이 어드민을 동시에 개발/운영하며 배포·리뷰 권한을 공개 사이트와 분리해야 할 때
2. Supabase RPC/Edge Function 한두 개로 안 되는 상시 서버 로직(백그라운드 잡, 큐 등)이 필요할 때
3. 어드민 배포 빈도가 공개 사이트 재빌드/캐시 무효화에 실질적 리스크를 줄 때
4. 무거운 어드민 UI 프레임워크가 퍼블릭 사이트 빌드 설정과 계속 충돌할 때

## 3. 데이터 모델 (Supabase / PostgreSQL)

```sql
-- 문제 원본 (정답 포함) — anon 직접 접근 전면 차단
create table quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('mc', 'ox')), -- 객관식 / OX
  question_text text not null,
  choices       jsonb,        -- mc: ["보기1","보기2","보기3","보기4"], ox: null
  correct_answer text not null, -- mc: choices의 인덱스("0"~"3"), ox: "O" | "X"
  explanation   text,          -- 연습 모드 정답 공개 시 같이 보여줄 해설
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table quiz_questions enable row level security;
-- anon/authenticated 대상 정책을 아예 만들지 않음 = 기본 전면 차단.
-- 어드민 CRUD는 authenticated + admins 테이블 확인 정책으로 별도 허용.

-- 정답이 빠진 공개 뷰 (연습/실제 테스트 문제 출제용)
create view quiz_questions_public as
  select id, type, question_text, choices
  from quiz_questions
  where is_active;

grant select on quiz_questions_public to anon;
```

> **후속 수정**: `get_random_practice_question`/`start_quiz_attempt` 두 RPC 모두 결국 이 뷰가 아니라 `quiz_questions` 원본 테이블을 직접 조회하도록 구현되어, 앱에서 이 뷰를 소비하는 코드가 하나도 없다. 게다가 Supabase가 뷰 생성 시 기본으로 부여하는 권한이 SELECT뿐 아니라 INSERT/UPDATE/DELETE까지 포함되어 있어 anon이 문제 은행을 훼손할 수 있는 의도치 않은 구멍이었다. 이후 마이그레이션에서 `revoke all on quiz_questions_public from anon, authenticated`로 접근을 전면 차단했다 (뷰 정의 자체는 향후 재사용을 위해 남겨둠).

```sql
-- 응시 기록 — anon 직접 접근 전면 차단, RPC로만 조작
create table quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  device_uuid     text not null,
  fingerprint_hash text,
  ip              inet,
  question_ids    jsonb not null,   -- 이번 응시에 뽑힌 문제 id 배열
  answers         jsonb,            -- 제출 시에만 채움
  score           int,
  total           int,
  status          text not null default 'in_progress'
                  check (status in ('in_progress', 'submitted')),
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz
);

alter table quiz_attempts enable row level security;
-- 정책 없음 = anon 전면 차단. 모든 접근은 SECURITY DEFINER RPC를 통해서만.

create table admins (
  id    uuid primary key references auth.users(id),
  email text not null
);
alter table admins enable row level security;
create policy "self read" on admins for select using (auth.uid() = id);
```

`device_uuid`에는 로그인 개념이 없으므로(익명 사용자), `quiz_attempts`에 대한 RLS를 행 단위로 걸 수 없다. 대신 **모든 조작을 `SECURITY DEFINER` RPC 함수로만 노출**하고 테이블 직접 접근은 막는다.

## 4. RPC 함수 (채점/중복 판정의 실제 경계)

- `start_quiz_attempt(device_uuid text, fingerprint_hash text)`
  - `quiz_attempts`에서 `status = 'submitted'`이고 `device_uuid` 또는 `fingerprint_hash`가 일치하는 행이 있으면 → 이미 응시함, 이전 점수 반환.
  - 없으면 `quiz_questions_public`에서 활성 문제 중 랜덤 서브셋(문항 수는 §6 참고)을 뽑아 `quiz_attempts` 행 생성, 문제 목록(정답 제외) + `attempt_id` 반환.
- `submit_quiz_attempt(attempt_id uuid, device_uuid text, answers jsonb)`
  - attempt가 존재하고 `device_uuid`가 일치하며 아직 `in_progress`인지 확인.
  - `quiz_questions.correct_answer`와 서버에서 직접 비교해 채점 — 정답 원문은 응답에 절대 포함하지 않음.
  - `score`/`total`만 반환하고 `status`를 `submitted`로 고정.
- `reveal_practice_answer(question_id uuid)`
  - 연습 모드 전용. 해당 문제의 `correct_answer` + `explanation`만 반환. 기기 제한 없음.

anon 키로는 이 세 함수만 호출 가능하도록 `grant execute`를 부여하고, `quiz_questions`/`quiz_attempts` 테이블 자체에는 아무 grant도 주지 않는다.

## 5. 기기 중복 응시 판정

이중 검증(초안) + FingerprintJS 오픈소스 한 겹 추가, 총 3개 신호를 쓰되 **하드 차단 기준은 device_uuid와 fingerprint_hash만** 사용한다.

- **device_uuid**: 클라이언트에서 발급한 UUID를 `localStorage` + 쿠키에 동시 저장 (하나가 지워져도 다른 쪽에서 복구). 1차 판정 기준.
- **fingerprint_hash**: `@fingerprintjs/fingerprintjs`(오픈소스, 무료) 방문자 해시. device_uuid가 삭제·변경된 경우의 2차 판정 기준.
- **ip**: 로그 목적으로만 저장. 공유 와이파이(가족/학교/회사)에서 오탐이 날 수 있어 **차단 조건으로는 쓰지 않는다.**

**알려진 한계**: 연습/실제가 같은 문제 풀을 공유하고(§6) 연습은 정답을 즉시 보여주므로, 문제 풀 전체를 반복 연습해 암기한 뒤 실제 테스트를 보면 사실상 답을 알고 보는 것과 같다. 팬사이트 캐주얼 퀴즈 수준에서는 감수하기로 한 트레이드오프이며, 필요해지면 연습 풀을 분리하거나 연습 정답 공개에 기기당 일일 횟수 제한을 추가하는 식으로 나중에 강화할 수 있다.

## 6. 퀴즈 플로우

- **연습 모드**: 기기 제한 없음. `quiz_questions_public`에서 무작위 1문제 요청 → 풀이 → `reveal_practice_answer`로 즉시 정답/해설 공개. 응시 기록 저장 안 함.
- **실제 테스트**: 기기당 1회. `start_quiz_attempt`로 응시 시작 → 전체 문제 풀에서 랜덤 서브셋(기본 10문항, 문제 풀 30문항 이상 확보 권장 — 정확한 문항 수는 콘텐츠 준비되는 대로 조정)을 한 번에 받아 전부 풀고 → `submit_quiz_attempt`로 일괄 제출 → 점수만 공개, 정답 비공개.
- 재방문 시 같은 기기로 실제 테스트 결과를 다시 조회할 수 있도록 `start_quiz_attempt`가 기존 `submitted` 응시를 찾으면 그 점수를 그대로 반환한다 (재응시는 아님).

## 7. 프론트엔드 구조

기존 `src/features/<feature>/{components,lib}` 컨벤션을 따른다. 퀴즈는 정적 데이터 파일이 없으므로 `data/`는 두지 않는다(다른 feature와의 의도적 차이).

```text
src/
  features/
    quiz/
      components/     # QuizPractice, QuizAttempt, QuizResult 등
      lib/
        types.ts       # Question, Attempt 등 도메인 타입
        device-id.ts    # device_uuid 발급/저장, fingerprint 초기화
  lib/
    supabase/
      client.ts         # anon key로 초기화되는 Supabase 클라이언트 (browser-only)
  app/
    (pages)/
      quiz/
        page.tsx          # 연습/실제 진입점
        practice/page.tsx
        test/page.tsx
    admin/
      layout.tsx            # Supabase Auth 체크 (공용 header/footer 없는 별도 레이아웃)
      quiz/page.tsx          # 문제 CRUD, 응시 기록 조회/리셋
```

`quiz` 관련 페이지는 전부 클라이언트 컴포넌트(`"use client"`)로 동작한다 — `output: "export"`에서는 서버 컴포넌트가 요청 시점에 데이터를 가져올 수 없으므로, 문제 fetch/제출은 전부 브라우저에서 Supabase JS 클라이언트로 수행한다.

## 8. 어드민 보호

- Supabase Auth 로그인 필수 (이메일 기반). `admins` 테이블에 없는 계정은 어드민 RPC/뮤테이션에서 거부.
- Cloudflare Access(Zero Trust)를 `ztmy-sounds.fans/admin/*` 경로에 적용해, Supabase Auth 화면이 뜨기 전 단계에서부터 이메일 OTP로 접근 차단 (무료 티어 50명까지).
- `/admin` 라우트에 `noindex` 메타 + `robots.txt` disallow 추가 (검색엔진 노출 방지 목적, 보안 목적 아님).

## 9. 도감과의 관계 (참고용, 범위 밖)

도감은 이 스펙의 대상이 아니지만, 같은 Supabase 프로젝트 + Cloudflare R2를 공유하도록 인프라를 설계해둔다 (초안 4절 그대로). 도감 데이터는 정답을 숨길 필요가 없으므로 초안 5.2절의 웹훅 SSG 파이프라인을 그대로 적용해도 무방하다 — 이 제약은 퀴즈에만 해당한다.

## 10. 확인이 필요한 가정 (구현 전 재확인)

- 실제 테스트 문항 수(기본 10문항 가정)와 최소 문제 풀 크기(30문항 이상 가정)는 콘텐츠 준비 상황에 맞춰 조정 필요.
- 실제 테스트 결과를 재방문 시 그대로 보여주는 것 외에, 관리자가 CS 목적으로 특정 device_uuid의 응시 기록을 삭제(재응시 허용)하는 기능이 어드민에 필요 — §8 어드민 범위에 포함해 구현.
