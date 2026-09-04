create or replace function submit_quiz_attempt(
  p_attempt_id uuid,
  p_device_uuid text,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt quiz_attempts;
  v_score int := 0;
  v_total int := 0;
  v_question record;
  v_submitted_answer text;
begin
  select * into v_attempt
  from quiz_attempts
  where id = p_attempt_id and device_uuid = p_device_uuid;

  if not found then
    raise exception 'attempt not found';
  end if;

  if v_attempt.status = 'submitted' then
    raise exception 'attempt already submitted';
  end if;

  for v_question in
    select id, correct_answer
    from quiz_questions
    where id in (select jsonb_array_elements_text(v_attempt.question_ids)::uuid)
  loop
    v_total := v_total + 1;
    v_submitted_answer := p_answers ->> v_question.id::text;
    if v_submitted_answer is not null and v_submitted_answer = v_question.correct_answer then
      v_score := v_score + 1;
    end if;
  end loop;

  update quiz_attempts
  set answers = p_answers,
      score = v_score,
      total = v_total,
      status = 'submitted',
      submitted_at = now()
  where id = p_attempt_id;

  return jsonb_build_object('score', v_score, 'total', v_total);
end;
$$;

grant execute on function submit_quiz_attempt(uuid, text, jsonb) to anon;
