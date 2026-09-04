create extension if not exists pgcrypto;

create table quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('mc', 'ox')),
  question_text  text not null,
  choices        jsonb,
  correct_answer text not null,
  explanation    text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table quiz_questions enable row level security;
-- 의도적으로 정책을 만들지 않음: RLS 활성화 + 정책 없음 = anon/authenticated 전면 차단.
-- 원본 테이블 소유자(마이그레이션 실행 role)는 RLS를 우회하므로 아래 뷰가 정상 동작한다.
-- (FORCE ROW LEVEL SECURITY는 절대 켜지 말 것 — 켜면 뷰까지 막혀버림)

create view quiz_questions_public as
  select id, type, question_text, choices
  from quiz_questions
  where is_active;

grant select on quiz_questions_public to anon;

create table quiz_attempts (
  id               uuid primary key default gen_random_uuid(),
  device_uuid      text not null,
  fingerprint_hash text,
  ip               inet,
  question_ids     jsonb not null,
  answers          jsonb,
  score            int,
  total            int,
  status           text not null default 'in_progress'
                   check (status in ('in_progress', 'submitted')),
  started_at       timestamptz not null default now(),
  submitted_at     timestamptz
);

alter table quiz_attempts enable row level security;
-- 정책 없음 = anon 전면 차단. 모든 접근은 SECURITY DEFINER RPC(Task 4~6)를 통해서만.

create index quiz_attempts_device_uuid_idx on quiz_attempts (device_uuid);
create index quiz_attempts_fingerprint_hash_idx on quiz_attempts (fingerprint_hash);
