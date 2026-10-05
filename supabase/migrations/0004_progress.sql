-- Study Nowie 2.0 — per-user progress, mistakes and marks
-- Everything in this file is owned by a single user and locked down by RLS.

create type chapter_state as enum ('not_started', 'learning', 'ncert_done', 'revised', 'tested');
create type test_kind as enum ('chapter_test', 'sample_paper', 'mock', 'school_exam');

create table public.checklist_progress (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  checklist_item_id  uuid not null references public.checklist_items (id) on delete cascade,
  is_complete        boolean not null default false,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, checklist_item_id)
);

create trigger checklist_progress_touch_updated_at
  before update on public.checklist_progress
  for each row execute function public.touch_updated_at();

-- The syllabus tracker grid.
create table public.chapter_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  chapter_id  uuid not null references public.chapters (id) on delete cascade,
  state       chapter_state not null default 'not_started',
  confidence  integer check (confidence between 1 and 5),
  updated_at  timestamptz not null default now(),
  unique (user_id, chapter_id)
);

create trigger chapter_progress_touch_updated_at
  before update on public.chapter_progress
  for each row execute function public.touch_updated_at();

-- The mistake notebook. This is where marks are actually recovered.
create table public.mistakes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  subject_id      uuid references public.subjects (id) on delete set null,
  chapter_id      uuid references public.chapters (id) on delete set null,
  question        text not null,
  what_went_wrong text,
  correct_method  text,
  source          text,                               -- where the question came from
  reattempt_on    date not null default (current_date + 3),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger mistakes_touch_updated_at
  before update on public.mistakes
  for each row execute function public.touch_updated_at();

create table public.test_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  subject_id  uuid references public.subjects (id) on delete set null,
  kind        test_kind not null default 'chapter_test',
  title       text not null,
  score       numeric(6,2) not null check (score >= 0),
  max_score   numeric(6,2) not null check (max_score > 0),
  percentage  numeric(5,2) generated always as (round((score / nullif(max_score, 0)) * 100, 2)) stored,
  taken_on    date not null default current_date,
  notes       text,
  created_at  timestamptz not null default now()
);

-- One row per day studied. Powers the streak and the daily minutes ring.
create table public.study_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  logged_on   date not null default current_date,
  minutes     integer not null default 0 check (minutes >= 0),
  updated_at  timestamptz not null default now(),
  unique (user_id, logged_on)
);

create trigger study_log_touch_updated_at
  before update on public.study_log
  for each row execute function public.touch_updated_at();

create index checklist_progress_user_idx on public.checklist_progress (user_id, is_complete);
create index checklist_progress_item_idx on public.checklist_progress (checklist_item_id);
create index chapter_progress_user_idx on public.chapter_progress (user_id, state);
create index mistakes_user_due_idx on public.mistakes (user_id, reattempt_on) where resolved_at is null;
create index mistakes_user_subject_idx on public.mistakes (user_id, subject_id);
create index test_scores_user_idx on public.test_scores (user_id, taken_on desc);
create index study_log_user_idx on public.study_log (user_id, logged_on desc);
