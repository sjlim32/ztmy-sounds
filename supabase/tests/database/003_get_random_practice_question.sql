begin;
select plan(3);

insert into quiz_questions (type, question_text, choices, correct_answer, is_active)
values ('mc', 'sample mc question', '["A","B","C","D"]'::jsonb, '1', true);

set local role anon;

select isnt(
  (select get_random_practice_question()),
  null,
  'anon은 get_random_practice_question을 호출할 수 있다'
);

select ok(
  (select get_random_practice_question()) ? 'question_text',
  '반환된 jsonb에 question_text 키가 있다'
);

select ok(
  not ((select get_random_practice_question()) ? 'correct_answer'),
  '반환된 jsonb에 correct_answer 키가 없다'
);

select * from finish();
rollback;
