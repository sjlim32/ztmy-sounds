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

  -- in_progress 재사용은 device_uuid만 기준으로 한다 (fingerprint_hash는 쓰지 않음).
  -- fingerprint는 흔한 기종/브라우저 조합에서 서로 다른 사람 사이에도 충돌하기
  -- 쉬운데, 여기서 fingerprint까지 매칭하면 콜리전 상대방에게 남의 in_progress
  -- attempt_id를 넘기게 되고, submit_quiz_attempt는 device_uuid까지 함께
  -- 확인하므로 그 사람은 영원히 제출할 수 없는 막다른 길에 갇힌다. device_uuid는
  -- 매 기기가 스스로 발급/보관하는 값이라 이 경로에서는 기기 자신과의 매칭만으로
  -- 충분하다 (제출 완료 여부 확인에서는 여전히 fingerprint_hash를 함께 본다 —
  -- 위 submitted 체크 참고).
  select * into v_in_progress
  from quiz_attempts
  where status = 'in_progress'
    and device_uuid = p_device_uuid
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

-- I5: quiz_questions_public는 앱에서 전혀 소비되지 않고(get_random_practice_question과
-- start_quiz_attempt 모두 원본 테이블을 직접 조회함), Supabase 기본 권한이 SELECT뿐
-- 아니라 INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER까지 부여한 상태였다
-- (anon이 update/delete로 문제 은행 전체를 훼손할 수 있었음, 재현 확인됨).
-- 뷰 정의 자체는 남겨두되(향후 "문제 목록 브라우징" 같은 기능이 생기면 재사용
-- 가능하도록) anon/authenticated의 모든 접근을 제거한다.
revoke all on quiz_questions_public from anon, authenticated;
