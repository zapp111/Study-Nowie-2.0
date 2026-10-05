-- Study Nowie 2.0 — quizzes, question bank and past papers
-- Question shape mirrors the real 2026 paper: mark value, difficulty and question type all matter.

create type question_type as enum ('mcq', 'assertion_reason', 'case_study', 'short_answer');
create type difficulty_level as enum ('easy', 'medium', 'hard');
create type paper_kind as enum ('previous_year', 'sample_paper', 'mock');

create table public.quizzes (
  id                  uuid primary key default gen_random_uuid(),
  session_subject_id  uuid references public.session_subjects (id) on delete cascade,
  subject_id          uuid references public.subjects (id) on delete set null,
  chapter_id          uuid references public.chapters (id) on delete set null,
  title               text not null,
  description         text,
  pass_percentage     integer not null default 70 check (pass_percentage between 0 and 100),
  time_limit_minutes  integer,
  is_published        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger quizzes_touch_updated_at
  before update on public.quizzes
  for each row execute function public.touch_updated_at();

-- Options are JSONB: an ordered array of strings. correct_index points into it.
create table public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes (id) on delete cascade,
  prompt          text not null,
  stimulus        text,                              -- case-study passage shown above the question
  options         jsonb not null,
  correct_index   integer not null check (correct_index >= 0),
  explanation     text,
  marks           integer not null default 1 check (marks between 1 and 5),
  difficulty      difficulty_level not null default 'medium',
  question_type   question_type not null default 'mcq',
  standard_only   boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  constraint quiz_questions_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint quiz_questions_enough_options check (jsonb_array_length(options) between 2 and 6),
  constraint quiz_questions_correct_index_in_range check (correct_index < jsonb_array_length(options))
);

-- One row per submitted attempt. Retakes are allowed; history is never overwritten.
create table public.quiz_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  quiz_id           uuid not null references public.quizzes (id) on delete cascade,
  score             integer not null check (score >= 0),
  total             integer not null check (total > 0),
  percentage        numeric(5,2) generated always as (round((score::numeric / nullif(total, 0)) * 100, 2)) stored,
  responses         jsonb not null default '[]'::jsonb,  -- [{questionId, selectedIndex, correct}]
  duration_seconds  integer,
  attempt_number    integer not null default 1,
  created_at        timestamptz not null default now()
);

-- Standalone practice questions, filterable and independent of the session plan.
create table public.question_bank (
  id             uuid primary key default gen_random_uuid(),
  subject_id     uuid not null references public.subjects (id) on delete cascade,
  chapter_id     uuid references public.chapters (id) on delete set null,
  prompt         text not null,
  stimulus       text,
  options        jsonb not null,
  correct_index  integer not null check (correct_index >= 0),
  explanation    text,
  marks          integer not null default 1 check (marks between 1 and 5),
  difficulty     difficulty_level not null default 'medium',
  question_type  question_type not null default 'mcq',
  standard_only  boolean not null default false,
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  constraint question_bank_options_is_array check (jsonb_typeof(options) = 'array'),
  constraint question_bank_enough_options check (jsonb_array_length(options) between 2 and 6),
  constraint question_bank_correct_index_in_range check (correct_index < jsonb_array_length(options))
);

create table public.previous_year_papers (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  year         integer not null check (year between 2010 and 2030),
  kind         paper_kind not null default 'previous_year',
  title        text not null,
  paper_url    text check (paper_url is null or paper_url ~* '^https?://'),
  storage_path text,                                  -- object key in the `papers` bucket
  solution_url text check (solution_url is null or solution_url ~* '^https?://'),
  max_marks    integer not null default 80,
  duration_minutes integer not null default 180,
  created_at   timestamptz not null default now(),
  constraint papers_has_a_source check (paper_url is not null or storage_path is not null)
);

create index quizzes_session_subject_idx on public.quizzes (session_subject_id);
create index quizzes_subject_idx on public.quizzes (subject_id);
create index quizzes_chapter_idx on public.quizzes (chapter_id);
create index quiz_questions_quiz_idx on public.quiz_questions (quiz_id, sort_order);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, created_at desc);
create index quiz_attempts_user_quiz_idx on public.quiz_attempts (user_id, quiz_id, created_at desc);
create index question_bank_filter_idx on public.question_bank (subject_id, chapter_id, difficulty);
create index question_bank_type_idx on public.question_bank (question_type);
create index papers_subject_year_idx on public.previous_year_papers (subject_id, year desc);
