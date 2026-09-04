begin;
select plan(4);

insert into quiz_questions (id, type, question_text, correct_answer, explanation, pool, is_active)
values ('77777777-7777-7777-7777-777777777777', 'ox', 'q', 'X', 'test explanation', 'practice', true);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
values ('88888888-8888-8888-8888-888888888888', 'ox', 'inactive', 'O', 'practice', false);

insert into quiz_questions (id, type, question_text, correct_answer, pool, is_active)
values ('66666666-6666-6666-6666-666666666601', 'ox', 'test only q', 'O', 'test_only', true);

set local role anon;

select is(
  (select reveal_practice_answer('77777777-7777-7777-7777-777777777777') ->> 'correct_answer'),
  'X',
  '활성 문제의 정답을 정확히 반환한다'
);

select is(
  (select reveal_practice_answer('77777777-7777-7777-7777-777777777777') ->> 'explanation'),
  'test explanation',
  '해설도 함께 반환한다'
);

prepare inactive_reveal as
  select reveal_practice_answer('88888888-8888-8888-8888-888888888888');
select throws_ok(
  'inactive_reveal', null, 'question not found',
  '비활성 문제는 정답을 공개하지 않는다'
);

prepare test_only_reveal as
  select reveal_practice_answer('66666666-6666-6666-6666-666666666601');
select throws_ok(
  'test_only_reveal', null, 'question not found',
  'test_only 풀 문제는 practice가 아니라서 정답을 공개하지 않는다'
);

select * from finish();
rollback;
