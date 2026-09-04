begin;
select plan(5);

insert into quiz_questions (id, type, question_text, correct_answer, is_active)
values
  ('44444444-4444-4444-4444-444444444444', 'ox', 'q1', 'O', true),
  ('55555555-5555-5555-5555-555555555555', 'ox', 'q2', 'X', true);

insert into quiz_attempts (id, device_uuid, question_ids, status)
values (
  '66666666-6666-6666-6666-666666666666',
  'device-submit',
  '["44444444-4444-4444-4444-444444444444","55555555-5555-5555-5555-555555555555"]'::jsonb,
  'in_progress'
);

set local role anon;

select is(
  (select (submit_quiz_attempt(
    '66666666-6666-6666-6666-666666666666', 'device-submit',
    '{"44444444-4444-4444-4444-444444444444":"O","55555555-5555-5555-5555-555555555555":"O"}'::jsonb
  ) ->> 'score')::int),
  1,
  '2문항 중 1문항만 맞으면 score는 1이다'
);

prepare wrong_device as
  select submit_quiz_attempt(
    '66666666-6666-6666-6666-666666666666', 'someone-else', '{}'::jsonb
  );
select throws_ok(
  'wrong_device', null, 'attempt not found',
  '다른 device_uuid로는 제출할 수 없다'
);

prepare resubmit as
  select submit_quiz_attempt(
    '66666666-6666-6666-6666-666666666666', 'device-submit', '{}'::jsonb
  );
select throws_ok(
  'resubmit', null, 'attempt already submitted',
  '이미 제출된 attempt는 다시 제출할 수 없다'
);

prepare unknown_attempt as
  select submit_quiz_attempt(gen_random_uuid(), 'device-submit', '{}'::jsonb);
select throws_ok(
  'unknown_attempt', null, 'attempt not found',
  '존재하지 않는 attempt_id는 거부된다'
);

reset role;
select is(
  (select status from quiz_attempts where id = '66666666-6666-6666-6666-666666666666'),
  'submitted',
  '제출 후 status가 submitted로 바뀐다'
);

select * from finish();
rollback;
