create or replace function get_random_practice_question() returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', id, 'type', type, 'question_text', question_text, 'choices', choices
  )
  from quiz_questions
  where is_active
  order by random()
  limit 1;
$$;

grant execute on function get_random_practice_question() to anon;
