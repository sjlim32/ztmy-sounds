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

prepare anon_select_attempts as select count(*) from quiz_attempts;
select throws_ok(
  'anon_select_attempts', '42501', null,
  'anon은 quiz_attempts를 직접 SELECT 할 수 없다'
);

prepare anon_insert_attempt as
  insert into quiz_attempts (device_uuid, question_ids) values ('x', '[]'::jsonb);
select throws_ok(
  'anon_insert_attempt', '42501', null,
  'anon은 quiz_attempts에 직접 INSERT 할 수 없다'
);

prepare anon_update_attempt as
  update quiz_attempts set score = 999
  where id = '33333333-3333-3333-3333-333333333333';
select throws_ok(
  'anon_update_attempt', '42501', null,
  'anon은 quiz_attempts를 직접 UPDATE 할 수 없다'
);

prepare anon_delete_attempt as
  delete from quiz_attempts where id = '33333333-3333-3333-3333-333333333333';
select throws_ok(
  'anon_delete_attempt', '42501', null,
  'anon은 quiz_attempts를 직접 DELETE 할 수 없다'
);

select * from finish();
rollback;
