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
  'small_test_pool', null, 'test_only pool has fewer than 8 active questions (found 0)',
  'test_only 활성 문제가 8개 미만이면 실제 테스트를 시작할 수 없다'
);

reset role;

update quiz_questions set is_active = true where pool = 'test_only';
update quiz_questions set difficulty = null where pool = 'practice';

set local role anon;

prepare small_hard_pool as select start_quiz_attempt('device-small-hard-pool', null);
select throws_ok(
  'small_hard_pool', null, 'practice hard/extreme pool has fewer than 2 active questions (found 0)',
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
