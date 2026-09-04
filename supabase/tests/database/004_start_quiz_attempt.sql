begin;
select plan(5);

insert into quiz_questions (id, type, question_text, correct_answer, is_active)
select gen_random_uuid(), 'ox', 'q' || n, 'O', true
from generate_series(1, 12) as n;

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
  '실제 테스트는 활성 문제 풀에서 10문항을 랜덤 서브셋으로 뽑는다'
);

select ok(
  not (
    select bool_or(q ? 'correct_answer')
    from jsonb_array_elements(start_quiz_attempt('device-new-3', null) -> 'questions') as q
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
