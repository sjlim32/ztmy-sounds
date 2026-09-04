begin;
select plan(5);

insert into quiz_questions (id, type, question_text, choices, correct_answer, explanation, is_active)
values ('11111111-1111-1111-1111-111111111111', 'ox', 'test question', null, 'X', 'test explanation', true);

set local role anon;

prepare anon_select as select count(*) from quiz_questions;
select throws_ok(
  'anon_select', '42501', null,
  'anon은 quiz_questions 테이블을 직접 SELECT 할 수 없다'
);

prepare anon_select_public_view as select count(*) from quiz_questions_public;
select throws_ok(
  'anon_select_public_view', '42501', null,
  'anon은 quiz_questions_public 뷰도 직접 조회할 수 없다 (앱에서 쓰지 않아 접근을 전면 차단함)'
);

select hasnt_column(
  'public', 'quiz_questions_public', 'correct_answer',
  'quiz_questions_public 뷰에는 correct_answer 컬럼이 없다'
);

select hasnt_column(
  'public', 'quiz_questions_public', 'explanation',
  'quiz_questions_public 뷰에는 explanation 컬럼이 없다'
);

prepare anon_insert as
  insert into quiz_questions (type, question_text, correct_answer) values ('ox', 'x', 'O');
select throws_ok('anon_insert', '42501', null, 'anon은 quiz_questions에 INSERT 할 수 없다');

select * from finish();
rollback;
