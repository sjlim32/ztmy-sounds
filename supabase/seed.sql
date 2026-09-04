insert into quiz_questions (type, question_text, choices, correct_answer, explanation, pool, difficulty, is_active)
values
  ('ox', '[샘플] 뉴비용 연습 문제입니다', null, 'O', '샘플 해설입니다', 'practice', 'easy', true),
  ('ox', '[샘플] 청년용 연습 문제입니다', null, 'X', '샘플 해설입니다', 'practice', 'medium', true),
  ('ox', '[샘플] 고인물용 연습 문제입니다', null, 'O', '샘플 해설입니다', 'practice', 'hard', true),
  ('ox', '[샘플] 할배용 연습 문제입니다', null, 'X', '샘플 해설입니다', 'practice', 'extreme', true);

insert into quiz_questions (type, question_text, choices, correct_answer, pool, is_active)
select
  'ox',
  '[샘플] 로컬 개발용 시험 전용 문제 ' || n,
  null,
  case when n % 2 = 0 then 'O' else 'X' end,
  'test_only',
  true
from generate_series(1, 8) as n;
