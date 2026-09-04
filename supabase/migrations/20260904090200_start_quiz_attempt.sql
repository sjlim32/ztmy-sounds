create or replace function start_quiz_attempt(
  p_device_uuid text,
  p_fingerprint_hash text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing quiz_attempts;
  v_attempt_id uuid;
  v_question_ids jsonb;
  v_questions jsonb;
  v_ip inet;
begin
  select * into v_existing
  from quiz_attempts
  where status = 'submitted'
    and (
      device_uuid = p_device_uuid
      or (p_fingerprint_hash is not null and fingerprint_hash = p_fingerprint_hash)
    )
  order by submitted_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'already_submitted', true,
      'attempt_id', v_existing.id,
      'score', v_existing.score,
      'total', v_existing.total
    );
  end if;

  begin
    v_ip := (current_setting('request.headers', true)::json ->> 'x-forwarded-for')::inet;
  exception when others then
    v_ip := null;
  end;

  select jsonb_agg(id) into v_question_ids
  from (
    select id from quiz_questions
    where is_active
    order by random()
    limit 10
  ) sub;

  if v_question_ids is null or jsonb_array_length(v_question_ids) = 0 then
    raise exception 'no active quiz questions available';
  end if;

  insert into quiz_attempts (device_uuid, fingerprint_hash, ip, question_ids, status)
  values (p_device_uuid, p_fingerprint_hash, v_ip, v_question_ids, 'in_progress')
  returning id into v_attempt_id;

  select jsonb_agg(jsonb_build_object(
    'id', q.id, 'type', q.type, 'question_text', q.question_text, 'choices', q.choices
  )) into v_questions
  from quiz_questions q
  where q.id in (select jsonb_array_elements_text(v_question_ids)::uuid);

  return jsonb_build_object(
    'already_submitted', false,
    'attempt_id', v_attempt_id,
    'questions', v_questions
  );
end;
$$;

grant execute on function start_quiz_attempt(text, text) to anon;
