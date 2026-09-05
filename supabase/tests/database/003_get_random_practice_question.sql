begin;
select plan(4);

insert into quiz_questions (id, type, question_text, choices, correct_answer, pool, difficulty, is_active)
values
  ('33333333-0000-0000-0000-000000000001', 'mc', 'easy q', '["A","B","C","D"]'::jsonb, '1', 'practice', 'easy', true),
  ('33333333-0000-0000-0000-000000000002', 'mc', 'hard q', '["A","B","C","D"]'::jsonb, '2', 'practice', 'hard', true),
  ('33333333-0000-0000-0000-000000000004', 'mc', 'medium q', '["A","B","C","D"]'::jsonb, '3', 'practice', 'medium', true);

insert into quiz_questions (id, type, question_text, correct_answer, pool, difficulty, is_active)
values ('33333333-0000-0000-0000-000000000003', 'ox', 'test only q tagged medium', 'O', 'test_only', 'medium', true);

set local role anon;

select isnt(
  (select get_random_practice_question('easy')),
  null,
  'anon은 easy 난이도로 문제를 받을 수 있다'
);

reset role;

select is(
  (
    select pool || '/' || difficulty
    from quiz_questions
    where id = ((select get_random_practice_question('easy')) ->> 'id')::uuid
  ),
  'practice/easy',
  '요청한 난이도의 practice 문제만 반환된다 (반환된 id를 직접 조회해 풀·난이도를 결정론적으로 검증 — 같은 풀의 다른 난이도(hard q, medium q)가 섞이면 즉시 실패)'
);

select is(
  (
    select pool || '/' || difficulty
    from quiz_questions
    where id = ((select get_random_practice_question('medium')) ->> 'id')::uuid
  ),
  'practice/medium',
  'test_only 풀에 같은 난이도(medium) 문제가 있어도 practice 풀 문제만 반환된다 (반환된 id를 직접 조회해 풀·난이도를 결정론적으로 검증 — test_only/medium 행이 반환되면 즉시 실패)'
);

set local role anon;

select ok(
  not ((select get_random_practice_question('easy')) ? 'correct_answer'),
  '반환된 jsonb에 correct_answer 키가 없다'
);

select * from finish();
rollback;
