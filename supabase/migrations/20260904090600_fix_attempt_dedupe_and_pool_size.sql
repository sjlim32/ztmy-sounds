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
  v_in_progress quiz_attempts;
  v_attempt_id uuid;
  v_question_ids jsonb;
  v_questions jsonb;
  v_ip inet;
  v_pool_size int;
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

  -- 이미 진행 중인 응시가 있으면 새로 만들지 않고 그대로 재사용한다.
  -- (제출 전 새로고침해도 매번 다른 서브셋이 나오는 문제와, 같은 기기가
  --  여러 in_progress 행을 만들어 순차 제출로 우회하는 문제를 함께 막는다)
  select * into v_in_progress
  from quiz_attempts
  where status = 'in_progress'
    and (
      device_uuid = p_device_uuid
      or (p_fingerprint_hash is not null and fingerprint_hash = p_fingerprint_hash)
    )
  order by started_at desc
  limit 1;

  if found then
    select jsonb_agg(jsonb_build_object(
      'id', q.id, 'type', q.type, 'question_text', q.question_text, 'choices', q.choices
    )) into v_questions
    from quiz_questions q
    where q.id in (select jsonb_array_elements_text(v_in_progress.question_ids)::uuid);

    return jsonb_build_object(
      'already_submitted', false,
      'attempt_id', v_in_progress.id,
      'questions', v_questions
    );
  end if;

  select count(*) into v_pool_size from quiz_questions where is_active;

  if v_pool_size < 10 then
    raise exception 'active question pool has fewer than 10 questions (found %)', v_pool_size;
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
  v_already_submitted quiz_attempts;
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

  -- 방어적 이중 체크: start_quiz_attempt가 in_progress를 재사용하므로 정상
  -- 흐름에서는 발생하지 않지만, 이 기기(또는 같은 fingerprint)가 다른
  -- attempt로 이미 제출을 마쳤다면 한 번 더 막는다.
  select * into v_already_submitted
  from quiz_attempts
  where status = 'submitted'
    and (
      device_uuid = p_device_uuid
      or (v_attempt.fingerprint_hash is not null and fingerprint_hash = v_attempt.fingerprint_hash)
    )
  limit 1;

  if found then
    raise exception 'device already submitted';
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
