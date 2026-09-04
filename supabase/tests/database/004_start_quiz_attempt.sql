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

reset role;

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

set local role anon;

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
