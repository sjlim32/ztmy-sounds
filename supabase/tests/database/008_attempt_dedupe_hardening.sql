begin;
select plan(4);

insert into quiz_questions (id, type, question_text, correct_answer, is_active)
select gen_random_uuid(), 'ox', 'q' || n, 'O', true
from generate_series(1, 12) as n;

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

update quiz_questions set is_active = false
where id not in (select id from quiz_questions order by id limit 3);

set local role anon;

prepare small_pool as select start_quiz_attempt('device-small-pool', null);
select throws_ok(
  'small_pool', null, null,
  '활성 문제가 10개 미만이면 실제 테스트를 시작할 수 없다'
);

reset role;

update quiz_questions set is_active = true;

insert into quiz_attempts (id, device_uuid, question_ids, status, score, total, submitted_at)
values (
  gen_random_uuid(), 'device-double-submit',
  (select jsonb_agg(id) from (select id from quiz_questions where is_active limit 10) s),
  'submitted', 7, 10, now()
);

insert into quiz_attempts (id, device_uuid, question_ids, status)
values (
  '99999999-9999-9999-9999-999999999999', 'device-double-submit',
  (select jsonb_agg(id) from (select id from quiz_questions where is_active limit 10) s),
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
