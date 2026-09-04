alter table quiz_questions
  add column pool text not null default 'practice' check (pool in ('practice', 'test_only')),
  add column difficulty text check (difficulty in ('easy', 'medium', 'hard', 'extreme'));
