begin;
select plan(4);

insert into quiz_questions (id, type, question_text, correct_answer, is_active)
values ('22222222-2222-2222-2222-222222222222', 'ox', 'test', 'O', true);

insert into quiz_attempts (id, device_uuid, question_ids, status, score)
values (
  '33333333-3333-3333-3333-333333333333', 'device-seed',
  '["22222222-2222-2222-2222-222222222222"]'::jsonb, 'in_progress', null
);

set local role anon;

select is(
  (select count(*) from quiz_attempts)::int, 0,
  'anon은 quiz_attempts를 직접 SELECT 할 수 없다'
);

prepare anon_insert_attempt as
  insert into quiz_attempts (device_uuid, question_ids) values ('x', '[]'::jsonb);
select throws_ok(
  'anon_insert_attempt', '42501', null,
  'anon은 quiz_attempts에 직접 INSERT 할 수 없다'
);

update quiz_attempts set score = 999
  where id = '33333333-3333-3333-3333-333333333333';
reset role;
select is(
  (select score from quiz_attempts where id = '33333333-3333-3333-3333-333333333333'),
  null,
  'anon의 UPDATE는 RLS에 막혀 반영되지 않는다'
);

set local role anon;
delete from quiz_attempts where id = '33333333-3333-3333-3333-333333333333';
reset role;
select is(
  (select count(*) from quiz_attempts
   where id = '33333333-3333-3333-3333-333333333333')::int,
  1,
  'anon의 DELETE는 RLS에 막혀 행이 삭제되지 않는다'
);

select * from finish();
rollback;
