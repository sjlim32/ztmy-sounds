begin;
select plan(4);

insert into quiz_questions (id, type, question_text, choices, correct_answer, pool, difficulty, is_active)
values
  ('33333333-0000-0000-0000-000000000001', 'mc', 'easy q', '["A","B","C","D"]'::jsonb, '1', 'practice', 'easy', true),
  ('33333333-0000-0000-0000-000000000002', 'mc', 'hard q', '["A","B","C","D"]'::jsonb, '2', 'practice', 'hard', true);

insert into quiz_questions (id, type, question_text, correct_answer, pool, difficulty, is_active)
values ('33333333-0000-0000-0000-000000000003', 'ox', 'test only q tagged medium', 'O', 'test_only', 'medium', true);

set local role anon;

select isnt(
  (select get_random_practice_question('easy')),
  null,
  'anon은 easy 난이도로 문제를 받을 수 있다'
);

select isnt(
  (select get_random_practice_question('easy') ->> 'id'),
  '33333333-0000-0000-0000-000000000003',
  '요청한 난이도의 practice 문제만 반환한다 (test_only 풀의 문제를 반환하지 않음을 확인)'
);

select isnt(
  (select get_random_practice_question('medium') ->> 'id'),
  '33333333-0000-0000-0000-000000000003',
  'test_only 풀 문제는 difficulty가 일치해도 practice 필터에 걸려 반환되지 않는다 (자기 자신의 id가 반환되지 않음을 확인 — 다른 practice/medium 문제가 이미 존재하더라도 성립하는 검증)'
);

select ok(
  not ((select get_random_practice_question('easy')) ? 'correct_answer'),
  '반환된 jsonb에 correct_answer 키가 없다'
);

select * from finish();
rollback;
