begin;
select plan(4);

insert into quiz_questions (type, question_text, choices, correct_answer, pool, difficulty, is_active)
values
  ('mc', 'easy q', '["A","B","C","D"]'::jsonb, '1', 'practice', 'easy', true),
  ('mc', 'hard q', '["A","B","C","D"]'::jsonb, '2', 'practice', 'hard', true);

insert into quiz_questions (type, question_text, correct_answer, pool, difficulty, is_active)
values ('ox', 'test only q tagged medium', 'O', 'test_only', 'medium', true);

set local role anon;

select isnt(
  (select get_random_practice_question('easy')),
  null,
  'anon은 easy 난이도로 문제를 받을 수 있다'
);

select is(
  (select get_random_practice_question('easy') ->> 'question_text'),
  'easy q',
  '요청한 난이도의 practice 문제만 반환한다'
);

select is(
  (select get_random_practice_question('medium')),
  null,
  'test_only 풀 문제는 difficulty가 일치해도 practice 필터에 걸려 반환되지 않는다'
);

select ok(
  not ((select get_random_practice_question('easy')) ? 'correct_answer'),
  '반환된 jsonb에 correct_answer 키가 없다'
);

select * from finish();
rollback;
