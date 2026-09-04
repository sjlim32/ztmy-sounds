begin;
select plan(3);

insert into quiz_questions (id, type, question_text, correct_answer, is_active)
values ('44444444-aaaa-aaaa-aaaa-444444444444', 'ox', 'lockdown test', 'O', true);

set local role anon;

prepare anon_update_view as
  update quiz_questions_public set question_text = 'PWNED' where true;
select throws_ok(
  'anon_update_view', '42501', null,
  'anon은 quiz_questions_public 뷰를 통해 UPDATE 할 수 없다'
);

prepare anon_delete_view as
  delete from quiz_questions_public;
select throws_ok(
  'anon_delete_view', '42501', null,
  'anon은 quiz_questions_public 뷰를 통해 DELETE 할 수 없다'
);

select table_privs_are(
  'public', 'quiz_questions_public', 'anon', '{}'::text[],
  'anon은 quiz_questions_public 뷰에 대한 권한이 전혀 없다'
);

select * from finish();
rollback;
