begin;
select plan(2);

select table_privs_are(
  'public', 'quiz_questions', 'anon', '{}'::text[],
  'anon은 quiz_questions에 대한 테이블 권한이 전혀 없다'
);

select table_privs_are(
  'public', 'quiz_attempts', 'anon', '{}'::text[],
  'anon은 quiz_attempts에 대한 테이블 권한이 전혀 없다'
);

select * from finish();
rollback;
