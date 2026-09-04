# 퀴즈 난이도/문제 풀 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연습 모드에 4단계 난이도(뉴비/청년/고인물/할배)를 도입하고, 실제 테스트를 "시험 전용 풀 8문항 + 연습 풀 hard/extreme 2문항"으로 구성한다.

**Architecture:** `quiz_questions`에 `pool`/`difficulty` 컬럼을 추가하고, 이를 소비하는 3개 RPC(`get_random_practice_question`, `start_quiz_attempt`, `reveal_practice_answer`)의 필터/구성 로직만 바꾼다. `submit_quiz_attempt`와 두 RPC의 응답 shape는 그대로라 프론트엔드 API 계약 대부분이 안전하다.

**Tech Stack:** 기존 퀴즈 기능과 동일(Supabase Postgres/RLS/RPC, pgTAP, Next.js 클라이언트 컴포넌트, Vitest).

**Spec:** [`docs/superpowers/specs/2026-09-05-quiz-difficulty-design.md`](../specs/2026-09-05-quiz-difficulty-design.md) (상위: [`2026-09-04-quiz-feature-design.md`](../specs/2026-09-04-quiz-feature-design.md))

## Global Constraints

- `difficulty` 컬럼은 nullable이고 `pool`과의 교차 DB 제약을 걸지 않는다 — practice 문제에 difficulty가 없으면 그냥 출제 후보에서 조용히 빠질 뿐 INSERT를 막지 않는다 (기존 pgTAP 픽스처 001/002/005/009 무변경 보장).
- 표시 이름 매핑은 프론트엔드 상수로만 존재: `easy`→"즛 뉴비", `medium`→"즛 청년", `hard`→"즛 고인물", `extreme`→"즛 할배". DB에는 저장하지 않는다.
- `start_quiz_attempt`는 `test_only` 풀 8개 + `practice` 풀의 `difficulty in ('hard','extreme')`(hard/extreme 구분 없이 합쳐서) 2개 = 총 10개로 구성하고, 최종 순서를 한 번 더 섞는다.
- `reveal_practice_answer`는 `pool = 'practice'`인 문제만 정답을 공개한다.
- `submit_quiz_attempt`의 채점/방어 로직은 변경하지 않는다.

---

### Task 1: 스키마 확장 + `get_random_practice_question` 난이도 필터

**Files:**

- Create: `supabase/migrations/20260905100000_quiz_difficulty_and_pool.sql`
- Create: `supabase/migrations/20260905100100_get_random_practice_question_difficulty.sql`
- Modify: `supabase/tests/database/003_get_random_practice_question.sql` (전면 재작성)

**Interfaces:**

- Consumes: 기존 `quiz_questions` 테이블 (Task 2 스펙)
- Produces: `quiz_questions.pool`/`quiz_questions.difficulty` 컬럼(이후 모든 태스크가 참조), RPC `get_random_practice_question(p_difficulty text) returns jsonb` — Task 6의 `getRandomPracticeQuestion(difficulty)`가 이 RPC를 호출.

- [ ] **Step 1: 실패하는 pgTAP 테스트로 전면 교체**

`supabase/tests/database/003_get_random_practice_question.sql`의 전체 내용을 아래로 교체:

```sql
begin;
select plan(4);

insert into quiz_questions (type, question_text, choices, correct_answer, pool, difficulty, is_active)
values
  ('mc', 'easy q', '["A","B","C","D"]'::jsonb, '1', 'practice', 'easy', true),
  ('mc', 'hard q', '["A","B","C","D"]'::jsonb, '2', 'practice', 'hard', true);

insert into quiz_questions (id, type, question_text, correct_answer, pool, difficulty, is_active)
values ('33333333-0000-0000-0000-000000000003', 'ox', 'test only q tagged medium', 'O', 'test_only', 'medium', true);

set local role anon;

select isnt(
  (select get_random_practice_question('easy')),
  null,
  'anon은 easy 난이도로 문제를 받을 수 있다'
);

select is(
  (select get_random_practice_question('easy') ->> 'question_text'),
  'easy q',
  '요청한 난이도의 practice 문제만 반환한다'
);

select isnt(
  (select get_random_practice_question('medium') ->> 'id'),
  '33333333-0000-0000-0000-000000000003',
  'test_only 풀 문제는 difficulty가 일치해도 practice 필터에 걸려 반환되지 않는다 (자기 자신의 id가 반환되지 않음을 확인 — 다른 practice/medium 문제가 이미 존재하더라도 성립하는 검증)'
);

select ok(
  not ((select get_random_practice_question('easy')) ? 'correct_answer'),
  '반환된 jsonb에 correct_answer 키가 없다'
);

select * from finish();
rollback;
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
pnpm exec supabase test db
```

Expected: FAIL — `function get_random_practice_question(unknown) does not exist` (기존 함수는 인자가 없어서 새 호출 형태와 시그니처가 안 맞음).

- [ ] **Step 3: 스키마 마이그레이션 작성**

`supabase/migrations/20260905100000_quiz_difficulty_and_pool.sql`:

```sql
alter table quiz_questions
  add column pool text not null default 'practice' check (pool in ('practice', 'test_only')),
  add column difficulty text check (difficulty in ('easy', 'medium', 'hard', 'extreme'));
```

- [ ] **Step 4: RPC 마이그레이션 작성 (기존 무인자 함수 제거 + 신규 함수 생성)**

`supabase/migrations/20260905100100_get_random_practice_question_difficulty.sql`:

```sql
drop function if exists get_random_practice_question();

create or replace function get_random_practice_question(p_difficulty text) returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', id, 'type', type, 'question_text', question_text, 'choices', choices
  )
  from quiz_questions
  where is_active and pool = 'practice' and difficulty = p_difficulty
  order by random()
  limit 1;
$$;

grant execute on function get_random_practice_question(text) to anon;
```

`drop function if exists get_random_practice_question();`가 없으면 인자 없는 기존 함수가 별도 오버로드로 계속 남아 anon이 호출할 수 있는 상태로 방치된다 — 반드시 먼저 지운다.

- [ ] **Step 5: 테스트 재실행 → 통과 확인**

```bash
pnpm exec supabase test db
```

Expected: PASS — 001, 002도 여전히 통과(무변경), 003 신규 4개 어산션 통과.

- [ ] **Step 6: 커밋**

```bash
git add supabase/migrations/20260905100000_quiz_difficulty_and_pool.sql supabase/migrations/20260905100100_get_random_practice_question_difficulty.sql supabase/tests/database/003_get_random_practice_question.sql
git commit -m "feat: quiz_questions에 pool/difficulty 컬럼 추가 및 연습 문제 난이도 필터 적용"
```

---

### Task 2: `start_quiz_attempt` 문제 풀 이원 구성

**Files:**

- Create: `supabase/migrations/20260905100200_quiz_attempt_pool_composition.sql`
- Modify: `supabase/tests/database/004_start_quiz_attempt.sql` (전면 재작성)

**Interfaces:**

- Consumes: Task 1의 `pool`/`difficulty` 컬럼
- Produces: `start_quiz_attempt` 반환 shape는 기존과 동일(`{already_submitted, attempt_id, score?, total?, questions?}`) — Task 7/8의 프론트엔드는 이 태스크로 인한 타입 변경이 없다.

- [ ] **Step 1: 실패하는 pgTAP 테스트로 전면 교체**

`supabase/tests/database/004_start_quiz_attempt.sql`의 전체 내용을 아래로 교체:

```sql
begin;
select plan(6);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
select gen_random_uuid(), 'ox', 'test-only-' || n, 'O', 'test_only', true
from generate_series(1, 8) as n;

insert into quiz_questions (id, type, question_text, correct_answer, pool, difficulty, is_active)
select gen_random_uuid(), 'ox', 'hard-' || n, 'O', 'practice',
  case when n % 2 = 0 then 'hard' else 'extreme' end, true
from generate_series(1, 4) as n;

insert into quiz_attempts (device_uuid, question_ids, status, score, total, submitted_at)
values ('device-already', '[]'::jsonb, 'submitted', 7, 10, now());

set local role anon;

select ok(
  (select (start_quiz_attempt('device-new', null) ->> 'already_submitted')::boolean) = false,
  '새 device_uuid로 시작하면 already_submitted는 false다'
);

select is(
  (select jsonb_array_length(start_quiz_attempt('device-new-2', null) -> 'questions')),
  10,
  '실제 테스트는 test_only 8개 + practice hard/extreme 2개로 총 10문항을 구성한다'
);

select is(
  (
    select count(*)
    from jsonb_array_elements(start_quiz_attempt('device-new-3', null) -> 'questions') as q
    join quiz_questions qq on qq.id = (q ->> 'id')::uuid
    where qq.pool = 'test_only'
  ),
  8::bigint,
  '구성된 10문항 중 test_only 풀 출신이 정확히 8개다'
);

select ok(
  not (
    select bool_or(q ? 'correct_answer')
    from jsonb_array_elements(start_quiz_attempt('device-new-4', null) -> 'questions') as q
  ),
  '반환된 문제 목록에는 correct_answer가 포함되지 않는다'
);

select ok(
  (select (start_quiz_attempt('device-already', null) ->> 'already_submitted')::boolean) = true,
  '이미 제출한 device_uuid로 다시 시작하면 already_submitted는 true다'
);

select is(
  (select (start_quiz_attempt('device-already', null) ->> 'score')::int),
  7,
  '이미 제출한 경우 이전 점수를 그대로 반환한다'
);

select * from finish();
rollback;
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
pnpm exec supabase test db
```

Expected: FAIL — 기존 `start_quiz_attempt`는 `pool`을 구분하지 않고 아무 활성 문제에서나 10개를 뽑으므로, "test_only 풀 출신이 정확히 8개" 어산션(그리고 그 전에 애초 풀 크기 조건)이 새 픽스처 구성과 맞지 않아 실패한다.

- [ ] **Step 3: RPC 마이그레이션 작성**

`supabase/migrations/20260905100200_quiz_attempt_pool_composition.sql`:

```sql
create or replace function start_quiz_attempt(
  p_device_uuid text,
  p_fingerprint_hash text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing quiz_attempts;
  v_in_progress quiz_attempts;
  v_attempt_id uuid;
  v_question_ids jsonb;
  v_questions jsonb;
  v_ip inet;
  v_test_pool_size int;
  v_hard_pool_size int;
begin
  select * into v_existing
  from quiz_attempts
  where status = 'submitted'
    and (
      device_uuid = p_device_uuid
      or (p_fingerprint_hash is not null and fingerprint_hash = p_fingerprint_hash)
    )
  order by submitted_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'already_submitted', true,
      'attempt_id', v_existing.id,
      'score', v_existing.score,
      'total', v_existing.total
    );
  end if;

  select * into v_in_progress
  from quiz_attempts
  where status = 'in_progress'
    and device_uuid = p_device_uuid
  order by started_at desc
  limit 1;

  if found then
    select jsonb_agg(jsonb_build_object(
      'id', q.id, 'type', q.type, 'question_text', q.question_text, 'choices', q.choices
    )) into v_questions
    from quiz_questions q
    where q.id in (select jsonb_array_elements_text(v_in_progress.question_ids)::uuid);

    return jsonb_build_object(
      'already_submitted', false,
      'attempt_id', v_in_progress.id,
      'questions', v_questions
    );
  end if;

  select count(*) into v_test_pool_size
  from quiz_questions where is_active and pool = 'test_only';

  if v_test_pool_size < 8 then
    raise exception 'test_only pool has fewer than 8 active questions (found %)', v_test_pool_size;
  end if;

  select count(*) into v_hard_pool_size
  from quiz_questions
  where is_active and pool = 'practice' and difficulty in ('hard', 'extreme');

  if v_hard_pool_size < 2 then
    raise exception 'practice hard/extreme pool has fewer than 2 active questions (found %)', v_hard_pool_size;
  end if;

  begin
    v_ip := (current_setting('request.headers', true)::json ->> 'x-forwarded-for')::inet;
  exception when others then
    v_ip := null;
  end;

  select jsonb_agg(id order by random()) into v_question_ids
  from (
    select id from (
      select id from quiz_questions
      where is_active and pool = 'test_only'
      order by random()
      limit 8
    ) test_subset
    union all
    select id from (
      select id from quiz_questions
      where is_active and pool = 'practice' and difficulty in ('hard', 'extreme')
      order by random()
      limit 2
    ) hard_subset
  ) combined;

  insert into quiz_attempts (device_uuid, fingerprint_hash, ip, question_ids, status)
  values (p_device_uuid, p_fingerprint_hash, v_ip, v_question_ids, 'in_progress')
  returning id into v_attempt_id;

  select jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'question_text', q.question_text, 'choices', q.choices
  )) into v_questions
  from quiz_questions q
  where q.id in (select jsonb_array_elements_text(v_question_ids)::uuid);

  return jsonb_build_object(
    'already_submitted', false,
    'attempt_id', v_attempt_id,
    'questions', v_questions
  );
end;
$$;
```

`in_progress` 재사용 조건은 이전 라운드에서 이미 `device_uuid`만 기준으로 고쳐둔 것을 그대로 유지한다(fingerprint 충돌 시 막다른 길 방지 — 되돌리지 말 것).

- [ ] **Step 4: 테스트 재실행 → 통과 확인**

```bash
pnpm exec supabase test db
```

Expected: PASS — 001, 002, 003도 여전히 통과, 004 신규 6개 어산션 통과. (005, 006, 008, 009는 다음 태스크들에서 다룸 — 지금 시점엔 008이 새 픽스처와 안 맞아 실패할 수 있음, 정상.)

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260905100200_quiz_attempt_pool_composition.sql supabase/tests/database/004_start_quiz_attempt.sql
git commit -m "feat: start_quiz_attempt을 test_only 8문항 + practice hard/extreme 2문항 구성으로 변경"
```

---

### Task 3: `reveal_practice_answer` 풀 검증 추가

**Files:**

- Create: `supabase/migrations/20260905100300_reveal_practice_answer_pool_check.sql`
- Modify: `supabase/tests/database/006_reveal_practice_answer.sql`

**Interfaces:**

- Consumes: Task 1의 `pool` 컬럼
- Produces: `reveal_practice_answer`는 `pool='practice'`가 아닌 문제 id에 대해 `'question not found'`를 던진다. RPC 시그니처/성공 응답 shape는 변경 없음.

- [ ] **Step 1: 실패하는 어산션 추가**

`supabase/tests/database/006_reveal_practice_answer.sql`의 전체 내용을 아래로 교체 (기존 3개 어산션 유지 + `pool` 명시 + test_only 차단 어산션 1개 추가):

```sql
begin;
select plan(4);

insert into quiz_questions (id, type, question_text, correct_answer, explanation, pool, is_active)
values ('77777777-7777-7777-7777-777777777777', 'ox', 'q', 'X', 'test explanation', 'practice', true);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
values ('88888888-8888-8888-8888-888888888888', 'ox', 'inactive', 'O', 'practice', false);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
values ('66666666-6666-6666-6666-666666666601', 'ox', 'test only q', 'O', 'test_only', true);

set local role anon;

select is(
  (select reveal_practice_answer('77777777-7777-7777-7777-777777777777') ->> 'correct_answer'),
  'X',
  '활성 문제의 정답을 정확히 반환한다'
);

select is(
  (select reveal_practice_answer('77777777-7777-7777-7777-777777777777') ->> 'explanation'),
  'test explanation',
  '해설도 함께 반환한다'
);

prepare inactive_reveal as
  select reveal_practice_answer('88888888-8888-8888-8888-888888888888');
select throws_ok(
  'inactive_reveal', null, 'question not found',
  '비활성 문제는 정답을 공개하지 않는다'
);

prepare test_only_reveal as
  select reveal_practice_answer('66666666-6666-6666-6666-666666666601');
select throws_ok(
  'test_only_reveal', null, 'question not found',
  'test_only 풀 문제는 practice가 아니라서 정답을 공개하지 않는다'
);

select * from finish();
rollback;
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
pnpm exec supabase test db
```

Expected: FAIL — `test_only_reveal` 어산션만 실패(기존 함수는 `pool`을 안 봐서 test_only 문제도 정답을 공개함).

- [ ] **Step 3: RPC 마이그레이션 작성**

`supabase/migrations/20260905100300_reveal_practice_answer_pool_check.sql`:

```sql
create or replace function reveal_practice_answer(p_question_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question quiz_questions;
begin
  select * into v_question
  from quiz_questions
  where id = p_question_id and is_active and pool = 'practice';

  if not found then
    raise exception 'question not found';
  end if;

  return jsonb_build_object(
    'correct_answer', v_question.correct_answer,
    'explanation', v_question.explanation
  );
end;
$$;
```

(`create or replace`로 시그니처가 그대로라 기존 `grant execute`는 유지된다.)

- [ ] **Step 4: 테스트 재실행 → 통과 확인**

```bash
pnpm exec supabase test db
```

Expected: PASS — 006의 4개 어산션 모두 통과.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260905100300_reveal_practice_answer_pool_check.sql supabase/tests/database/006_reveal_practice_answer.sql
git commit -m "feat: reveal_practice_answer가 practice 풀 문제만 정답을 공개하도록 제한"
```

---

### Task 4: `008_attempt_dedupe_hardening.sql` 이원 풀 픽스처로 재작성

**Files:**

- Modify: `supabase/tests/database/008_attempt_dedupe_hardening.sql` (전면 재작성)

**Interfaces:**

- Consumes: Task 2의 `start_quiz_attempt` (test_only 8개 미만 / practice hard·extreme 2개 미만 시 각각 예외)
- Produces: 없음 (테스트 전용 태스크)

- [ ] **Step 1: 전면 재작성 (기존 단일 풀 픽스처 → 이원 풀 픽스처, 기존 5개 시나리오 유지 + 풀별 부족 예외 분리로 6개)**

`supabase/tests/database/008_attempt_dedupe_hardening.sql`의 전체 내용을 아래로 교체:

```sql
begin;
select plan(6);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
select gen_random_uuid(), 'ox', 'test-only-' || n, 'O', 'test_only', true
from generate_series(1, 8) as n;

insert into quiz_questions (id, type, question_text, correct_answer, pool, difficulty, is_active)
select gen_random_uuid(), 'ox', 'hard-' || n, 'O', 'practice', 'hard', true
from generate_series(1, 4) as n;

set local role anon;

select is(
  (select (start_quiz_attempt('device-reuse', null) ->> 'attempt_id')),
  (select (start_quiz_attempt('device-reuse', null) ->> 'attempt_id')),
  '같은 device_uuid로 다시 시작하면 새 attempt가 아니라 기존 in_progress를 재사용한다'
);

reset role;

select is(
  (select count(*) from quiz_attempts where device_uuid = 'device-reuse')::int,
  1,
  'in_progress 상태에서 반복 호출해도 행이 하나만 생기고 새 서브셋을 다시 뽑지 않는다'
);

set local role anon;

select isnt(
  (select (start_quiz_attempt('device-collide-a', 'fp-shared') ->> 'attempt_id')),
  (select (start_quiz_attempt('device-collide-b', 'fp-shared') ->> 'attempt_id')),
  '같은 fingerprint_hash를 공유하는 서로 다른 device_uuid는 같은 in_progress attempt를 받지 않는다 (충돌 시 막다른 길 방지)'
);

reset role;

update quiz_questions set is_active = false where pool = 'test_only';

set local role anon;

prepare small_test_pool as select start_quiz_attempt('device-small-test-pool', null);
select throws_ok(
  'small_test_pool', null, null,
  'test_only 활성 문제가 8개 미만이면 실제 테스트를 시작할 수 없다'
);

reset role;

update quiz_questions set is_active = true where pool = 'test_only';
update quiz_questions set difficulty = null where pool = 'practice';

set local role anon;

prepare small_hard_pool as select start_quiz_attempt('device-small-hard-pool', null);
select throws_ok(
  'small_hard_pool', null, null,
  'practice hard/extreme 활성 문제가 2개 미만이면 실제 테스트를 시작할 수 없다'
);

reset role;

insert into quiz_attempts (id, device_uuid, question_ids, status, score, total, submitted_at)
values (
  gen_random_uuid(), 'device-double-submit',
  (select jsonb_agg(id) from (select id from quiz_questions where pool = 'test_only' limit 8) s),
  'submitted', 7, 10, now()
);

insert into quiz_attempts (id, device_uuid, question_ids, status)
values (
  '99999999-9999-9999-9999-999999999999', 'device-double-submit',
  (select jsonb_agg(id) from (select id from quiz_questions where pool = 'test_only' limit 8) s),
  'in_progress'
);

set local role anon;
prepare double_submit as
  select submit_quiz_attempt(
    '99999999-9999-9999-9999-999999999999', 'device-double-submit', '{}'::jsonb
  );
select throws_ok(
  'double_submit', null, 'device already submitted',
  '해당 기기가 이미 submitted 상태라면 다른 in_progress attempt도 제출할 수 없다'
);

select * from finish();
rollback;
```

- [ ] **Step 2: 테스트 실행 → 통과 확인**

```bash
pnpm exec supabase test db
```

Expected: PASS — 001부터 009(다음 태스크 전까지는 008 포함)까지 전부 통과. 이 시점에 `supabase/tests/database/` 전체가 다시 녹색이어야 한다.

- [ ] **Step 3: 커밋**

```bash
git add supabase/tests/database/008_attempt_dedupe_hardening.sql
git commit -m "test: 008을 test_only/practice 이원 풀 픽스처로 재작성"
```

---

### Task 5: 로컬 개발용 시드 데이터 갱신

**Files:**

- Modify: `supabase/seed.sql`

**Interfaces:**

- Consumes: Task 1의 `pool`/`difficulty` 컬럼
- Produces: 로컬 `supabase db reset` 시 연습 4문항(난이도별 1개씩) + 시험 전용 8문항이 자동으로 채워짐 — Task 8의 수동 브라우저 검증이 이 데이터에 의존.

- [ ] **Step 1: `supabase/seed.sql` 전체 내용을 아래로 교체**

```sql
insert into quiz_questions (type, question_text, choices, correct_answer, explanation, pool, difficulty, is_active)
values
  ('ox', '[샘플] 뉴비용 연습 문제입니다', null, 'O', '샘플 해설입니다', 'practice', 'easy', true),
  ('ox', '[샘플] 청년용 연습 문제입니다', null, 'X', '샘플 해설입니다', 'practice', 'medium', true),
  ('ox', '[샘플] 고인물용 연습 문제입니다', null, 'O', '샘플 해설입니다', 'practice', 'hard', true),
  ('ox', '[샘플] 할배용 연습 문제입니다', null, 'X', '샘플 해설입니다', 'practice', 'extreme', true);

insert into quiz_questions (type, question_text, choices, correct_answer, pool, is_active)
select
  'ox',
  '[샘플] 로컬 개발용 시험 전용 문제 ' || n,
  null,
  case when n % 2 = 0 then 'O' else 'X' end,
  'test_only',
  true
from generate_series(1, 8) as n;
```

- [ ] **Step 2: 반영 확인**

```bash
pnpm exec supabase db reset
docker exec -i supabase_db_ztmy-sounds psql -U postgres -t -A -c "select pool, count(*) from quiz_questions group by pool order by pool;"
```

Expected: `practice` 4행, `test_only` 8행이 출력됨.

- [ ] **Step 3: 커밋**

```bash
git add supabase/seed.sql
git commit -m "feat: 로컬 시드 데이터를 난이도/문제 풀 구조에 맞게 갱신"
```

---

### Task 6: 프론트엔드 타입/API 래퍼 갱신

**Files:**

- Modify: `src/features/quiz/lib/types.ts`
- Modify: `src/features/quiz/lib/api.ts`
- Modify: `src/features/quiz/lib/api.test.ts`

**Interfaces:**

- Consumes: Task 1의 RPC `get_random_practice_question(p_difficulty text)`
- Produces: `export type Difficulty = "easy" | "medium" | "hard" | "extreme"`, `export const DIFFICULTY_LABELS: Record<Difficulty, string>`, `getRandomPracticeQuestion(difficulty: Difficulty): Promise<PracticeQuestion | null>` — Task 7의 `QuizPractice`와 Task 8의 practice 페이지가 이 타입/함수를 소비.

- [ ] **Step 1: 타입 추가**

`src/features/quiz/lib/types.ts` 맨 위에 추가 (기존 `QuestionType` 위 또는 아래, 다른 타입 정의는 그대로 둠):

```ts
export type Difficulty = "easy" | "medium" | "hard" | "extreme";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "즛 뉴비",
  medium: "즛 청년",
  hard: "즛 고인물",
  extreme: "즛 할배",
};
```

- [ ] **Step 2: 실패하는 테스트로 교체**

`src/features/quiz/lib/api.test.ts`에서 `getRandomPracticeQuestion` 관련 부분을 아래로 교체 (다른 `it` 블록들은 그대로 둠):

```ts
it("getRandomPracticeQuestion passes the difficulty and returns data", async () => {
  vi.mocked(supabase.rpc).mockResolvedValue({
    data: { id: "q1", type: "ox", question_text: "?", choices: null },
    error: null,
  } as never);

  const result = await getRandomPracticeQuestion("easy");

  expect(supabase.rpc).toHaveBeenCalledWith("get_random_practice_question", {
    p_difficulty: "easy",
  });
  expect(result?.id).toBe("q1");
});
```

마지막의 "throws when Supabase returns an error" 테스트도 `getRandomPracticeQuestion()` 호출을 `getRandomPracticeQuestion("easy")`로 바꾼다:

```ts
await expect(getRandomPracticeQuestion("easy")).rejects.toThrow("boom");
```

- [ ] **Step 3: 테스트 실행 → 실패 확인 (타입 에러로 실패)**

```bash
pnpm test -- src/features/quiz/lib/api.test.ts
```

Expected: FAIL — `getRandomPracticeQuestion`이 아직 인자를 안 받아서 타입/런타임 불일치.

- [ ] **Step 4: `api.ts` 구현 변경**

`src/features/quiz/lib/api.ts`의 import와 `getRandomPracticeQuestion` 함수를 아래로 교체:

```ts
import { supabase } from "@/lib/supabase/client";
import type {
  Difficulty,
  PracticeQuestion,
  RevealAnswerResult,
  StartAttemptResult,
  SubmitAttemptResult,
} from "./types";

export async function getRandomPracticeQuestion(
  difficulty: Difficulty,
): Promise<PracticeQuestion | null> {
  const { data, error } = await supabase.rpc("get_random_practice_question", {
    p_difficulty: difficulty,
  });
  if (error) throw error;
  return (data as PracticeQuestion | null) ?? null;
}
```

(나머지 함수 `revealPracticeAnswer`/`startQuizAttempt`/`submitQuizAttempt`는 변경 없음.)

- [ ] **Step 5: 테스트 재실행 → 통과 확인**

```bash
pnpm test -- src/features/quiz/lib/api.test.ts
```

Expected: PASS — 5개 테스트 전부.

- [ ] **Step 6: 커밋**

```bash
git add src/features/quiz/lib/types.ts src/features/quiz/lib/api.ts src/features/quiz/lib/api.test.ts
git commit -m "feat: 퀴즈 난이도 타입 및 getRandomPracticeQuestion API 시그니처 변경"
```

---

### Task 7: `QuizPractice` 컴포넌트에 난이도 prop 추가

**Files:**

- Modify: `src/features/quiz/components/QuizPractice.tsx`

**Interfaces:**

- Consumes: Task 6의 `Difficulty` 타입, `getRandomPracticeQuestion(difficulty)`
- Produces: `QuizPractice({ difficulty }: { difficulty: Difficulty })` — Task 8의 practice 페이지가 이 prop으로 컴포넌트를 렌더링.

- [ ] **Step 1: import 및 컴포넌트 시그니처 변경**

`src/features/quiz/components/QuizPractice.tsx` 상단 import를 아래로 교체:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getRandomPracticeQuestion,
  revealPracticeAnswer,
} from "@/features/quiz/lib/api";
import type {
  Difficulty,
  PracticeQuestion,
  RevealAnswerResult,
} from "@/features/quiz/lib/types";

type Phase = "loading" | "answering" | "revealed" | "error" | "empty";

export function QuizPractice({ difficulty }: { difficulty: Difficulty }) {
```

`fetchQuestion`의 정의와 의존성 배열을 아래로 교체 (나머지 state 선언·`loadQuestion`·`useEffect`·렌더 부분은 그대로 둠):

```tsx
const fetchQuestion = useCallback(() => {
  getRandomPracticeQuestion(difficulty)
    .then((q) => {
      if (!q) {
        setPhase("empty");
        return;
      }
      setQuestion(q);
      setPhase("answering");
    })
    .catch(() => setPhase("error"));
}, [difficulty]);
```

**중요:** 이 태스크만으로는 `difficulty`가 바뀌었을 때 `selected`/`reveal`의 이전 값이 남아있을 수 있다 — Task 8에서 practice 페이지가 `<QuizPractice key={difficulty} difficulty={difficulty} />`처럼 `key`를 줘서 난이도가 바뀌면 컴포넌트를 통째로 리마운트하게 만들어 해결한다. 이 컴포넌트 자체는 `key`로 리마운트되는 것을 전제로 하므로 별도 리셋 로직을 추가하지 않는다.

- [ ] **Step 2: 타입체크/린트로 확인 (이 컴포넌트는 자동 테스트가 없음 — 기존 결정 유지)**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: 둘 다 에러 없음 (단, Task 8을 아직 안 했다면 `QuizPractice`를 호출하는 `practice/page.tsx`가 인자 없이 호출 중이라 타입 에러가 날 수 있음 — Task 8까지 마친 뒤 다시 확인해도 됨).

- [ ] **Step 3: 커밋**

```bash
git add src/features/quiz/components/QuizPractice.tsx
git commit -m "feat: QuizPractice에 difficulty prop 추가"
```

---

### Task 8: 연습 페이지 난이도 선택 화면

**Files:**

- Modify: `src/app/(pages)/quiz/practice/page.tsx`

**Interfaces:**

- Consumes: Task 6의 `Difficulty`/`DIFFICULTY_LABELS`, Task 7의 `QuizPractice({ difficulty })`
- Produces: `/quiz/practice` — 쿼리스트링 없으면 난이도 선택 화면, `?difficulty=<값>`이 있으면 해당 난이도로 `QuizPractice` 렌더링.

- [ ] **Step 1: 전체 내용 교체**

`src/app/(pages)/quiz/practice/page.tsx`:

```tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QuizPractice } from "@/features/quiz/components/QuizPractice";
import { DIFFICULTY_LABELS } from "@/features/quiz/lib/types";
import type { Difficulty } from "@/features/quiz/lib/types";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "extreme"];

function isDifficulty(value: string | null): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty);
}

function DifficultyPicker() {
  return (
    <div className="flex flex-col gap-3">
      {DIFFICULTIES.map((difficulty) => (
        <Link
          key={difficulty}
          href={`/quiz/practice?difficulty=${difficulty}`}
          className="hover:border-ztmy-purple rounded-sm border border-white/20 px-4 py-3 text-white"
        >
          {DIFFICULTY_LABELS[difficulty]}
        </Link>
      ))}
    </div>
  );
}

function QuizPracticeContent() {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get("difficulty");

  if (!isDifficulty(difficultyParam)) {
    return <DifficultyPicker />;
  }

  return <QuizPractice key={difficultyParam} difficulty={difficultyParam} />;
}

export default function QuizPracticePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-white">퀴즈 연습</h1>
      <Suspense fallback={<p className="text-white/60">불러오는 중...</p>}>
        <QuizPracticeContent />
      </Suspense>
    </main>
  );
}
```

`useSearchParams()`는 Next.js App Router에서 `<Suspense>` 경계 없이 쓰면 정적 export 빌드가 실패한다 — 반드시 `QuizPracticeContent`를 `Suspense`로 감싼 채로 유지한다.

- [ ] **Step 2: 타입체크/린트**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: 둘 다 에러 없음 — 이제 Task 7의 `QuizPractice`가 요구하는 `difficulty` prop이 항상 채워져서 호출된다.

- [ ] **Step 3: 로컬 프로덕션 빌드로 정적 export 확인**

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUB_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH pnpm build
```

Expected: 성공, `/quiz/practice`가 정적 라우트로 나옴 (Suspense 경계 없이 `useSearchParams`를 쓰면 여기서 실패하니 이 스텝이 실질적인 회귀 가드).

- [ ] **Step 4: 커밋**

```bash
git add "src/app/(pages)/quiz/practice/page.tsx"
git commit -m "feat: 퀴즈 연습 페이지에 난이도 선택 화면 추가"
```

---

### Task 9: 최종 검증

**Files:** 없음 (검증 전용 태스크)

**Interfaces:**

- Consumes: Task 1~8의 전체 결과물
- Produces: 없음

- [ ] **Step 1: 전체 자동 테스트**

```bash
pnpm exec supabase db reset
pnpm exec supabase test db
pnpm test
pnpm lint
pnpm exec tsc --noEmit
```

Expected: pgTAP 전체 PASS, Vitest 전체 PASS, lint/tsc 클린.

- [ ] **Step 2: 로컬 서버에서 실제 RPC 호출로 수동 검증 (컨트롤러가 실행 — UI 컴포넌트 자동 테스트가 없다는 기존 결정 유지)**

로컬 Supabase가 떠 있는 상태에서, 브라우저가 호출하는 것과 동일한 방식으로 curl 확인:

```bash
URL=http://127.0.0.1:54321
KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

curl -s -X POST "$URL/rest/v1/rpc/get_random_practice_question" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"p_difficulty":"easy"}'
```

Expected: `question_text`가 "[샘플] 뉴비용 연습 문제입니다"인 jsonb, `correct_answer` 키 없음.

```bash
curl -s -X POST "$URL/rest/v1/rpc/start_quiz_attempt" \
  -H "apikey: $KEY" -H "Content-Type: application/json" \
  -d '{"p_device_uuid":"final-check-device","p_fingerprint_hash":null}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['questions']))"
```

Expected: `10`

- [ ] **Step 3: 브라우저에서 육안 확인 요청**

이 세션(컨트롤러)은 브라우저 자동화 도구가 없다 — `/quiz/practice`에서 난이도 4개 카드가 뜨고, 하나 고르면 문제가 나오고, 다른 난이도로 바꿔도(뒤로가기 후 다른 카드 선택) 이전 난이도의 선택/정답 상태가 안 남아있는지 실제 브라우저로 확인해달라고 사용자에게 요청한다.
