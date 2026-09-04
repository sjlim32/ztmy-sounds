begin;
select plan(6);

select table_privs_are(
  'public', 'quiz_questions', 'anon', '{}'::text[],
  'anon은 quiz_questions에 대한 테이블 권한이 전혀 없다'
);

select table_privs_are(
  'public', 'quiz_attempts', 'anon', '{}'::text[],
  'anon은 quiz_attempts에 대한 테이블 권한이 전혀 없다'
);

select table_privs_are(
  'public', 'quiz_questions', 'authenticated', '{}'::text[],
  'authenticated에게도 quiz_questions에 대한 테이블 권한이 전혀 없다'
);

select table_privs_are(
  'public', 'quiz_attempts', 'authenticated', '{}'::text[],
  'authenticated에게도 quiz_attempts에 대한 테이블 권한이 전혀 없다'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'quiz_questions'),
  'quiz_questions는 RLS가 켜져 있다'
);

select ok(
  (select relrowsecurity from pg_class where relname = 'quiz_attempts'),
  'quiz_attempts는 RLS가 켜져 있다'
);

select * from finish();
rollback;
