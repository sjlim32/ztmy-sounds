create or replace function reveal_practice_answer(p_question_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question quiz_questions;
begin
  select * into v_question from quiz_questions where id = p_question_id and is_active;

  if not found then
    raise exception 'question not found';
  end if;

  return jsonb_build_object(
    'correct_answer', v_question.correct_answer,
    'explanation', v_question.explanation
  );
end;
$$;

grant execute on function reveal_practice_answer(uuid) to anon;
