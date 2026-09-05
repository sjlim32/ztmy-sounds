drop function if exists reveal_practice_answer(uuid);

create or replace function reveal_practice_answer(
  p_question_id uuid,
  p_device_uuid text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question quiz_questions;
begin
  select * into v_question
  from quiz_questions
  where id = p_question_id and is_active and pool = 'practice';

  if not found then
    raise exception 'question not found';
  end if;

  if p_device_uuid is not null and exists (
    select 1
    from quiz_attempts a,
         jsonb_array_elements_text(a.question_ids) as qid(id)
    where a.device_uuid = p_device_uuid
      and a.status = 'in_progress'
      and qid.id = p_question_id::text
  ) then
    raise exception 'question not found';
  end if;

  return jsonb_build_object(
    'correct_answer', v_question.correct_answer,
    'explanation', v_question.explanation
  );
end;
$$;

grant execute on function reveal_practice_answer(uuid, text) to anon;
