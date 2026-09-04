insert into quiz_questions (type, question_text, choices, correct_answer, explanation, is_active)
values ('ox', '[샘플] 로컬 개발용 연습 문제입니다', null, 'O', '샘플 해설입니다', true);

insert into quiz_questions (type, question_text, choices, correct_answer, is_active)
select
  'ox',
  '[샘플] 로컬 개발용 실제 테스트 문제 ' || n,
  null,
  case when n % 2 = 0 then 'O' else 'X' end,
  true
from generate_series(1, 12) as n;
