-- 주의: 이 버전의 셔플(맨 아래 SELECT의 바깥쪽 ORDER BY)은 죽은 코드입니다 —
-- 단일 행으로 collapse되는 집계 쿼리에서 바깥쪽 ORDER BY는 집계에 아무 영향을
-- 주지 못합니다. 50초 뒤 20260905100250_fix_start_quiz_attempt_shuffle.sql이
-- 이 함수를 완전히 대체합니다. 이 파일을 새 마이그레이션의 템플릿으로 복사하지
-- 마세요 — 대신 100250을 참고하세요.
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
  v_test_pool_size int;
  v_hard_pool_size int;
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

  select count(*) into v_test_pool_size
  from quiz_questions where is_active and pool = 'test_only';

  if v_test_pool_size < 8 then
    raise exception 'test_only pool has fewer than 8 active questions (found %)', v_test_pool_size;
  end if;

  select count(*) into v_hard_pool_size
  from quiz_questions
  where is_active and pool = 'practice' and difficulty in ('hard', 'extreme');

  if v_hard_pool_size < 2 then
    raise exception 'practice hard/extreme pool has fewer than 2 active questions (found %)', v_hard_pool_size;
  end if;

  begin
    v_ip := (current_setting('request.headers', true)::json ->> 'x-forwarded-for')::inet;
  exception when others then
    v_ip := null;
  end;

  select jsonb_agg(id) into v_question_ids
  from (
    select id from (
      select id from quiz_questions
      where is_active and pool = 'test_only'
      order by random()
      limit 8
    ) test_subset
    union all
    select id from (
      select id from quiz_questions
      where is_active and pool = 'practice' and difficulty in ('hard', 'extreme')
      order by random()
      limit 2
    ) hard_subset
  ) combined
  order by random();

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
