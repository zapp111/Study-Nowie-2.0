-- Study Nowie 2.0 — curriculum
-- Subjects, the chapter master (with board weightage), and the day-by-day session plan.

create type study_phase as enum ('foundation', 'syllabus', 'revision', 'sprint');
create type resource_kind as enum ('youtube', 'ncert_pdf', 'notes', 'extra_questions', 'other');
create type cbq_frequency as enum ('low', 'medium', 'high', 'very_high');

-- The five papers.
create table public.subjects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  short_name      text not null,
  accent          text not null default 'rose',     -- colour token used by the UI
  paper_date      date,                             -- from the published datesheet
  theory_marks    integer not null default 80,
  internal_marks  integer not null default 20,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

comment on column public.subjects.paper_date is 'Board paper date. Drives reverse-datesheet revision ordering in February.';

-- Chapter master. board_weightage is what makes the planner prioritise correctly.
create table public.chapters (
  id               uuid primary key default gen_random_uuid(),
  subject_id       uuid not null references public.subjects (id) on delete cascade,
  number           integer not null,
  name             text not null,
  unit             text,
  board_weightage  integer not null default 0 check (board_weightage >= 0),
  cbq_frequency    cbq_frequency not null default 'medium',
  standard_only    boolean not null default false,  -- true = Maths Standard syllabus only
  notes            text,
  created_at       timestamptz not null default now(),
  unique (subject_id, number)
);

comment on column public.chapters.board_weightage is 'Marks this chapter carries in the 80-mark paper.';
comment on column public.chapters.standard_only is 'Hidden when the student is on Maths Basic.';

-- A session is one day of the plan.
create table public.sessions (
  id              uuid primary key default gen_random_uuid(),
  session_number  integer not null unique,
  scheduled_date  date not null,
  phase           study_phase not null default 'foundation',
  title           text not null,
  summary         text,
  focus_topics    text[] not null default '{}',
  requires_session integer,                          -- previous session number that gates this one
  is_published    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();

-- One subject block inside a session.
create table public.session_subjects (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.sessions (id) on delete cascade,
  subject_id         uuid not null references public.subjects (id) on delete restrict,
  chapter_id         uuid references public.chapters (id) on delete set null,
  chapter_name       text not null,
  focus_topic        text not null,
  estimated_minutes  integer not null default 50 check (estimated_minutes between 5 and 300),
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  unique (session_id, subject_id)
);

create table public.checklist_items (
  id                  uuid primary key default gen_random_uuid(),
  session_subject_id  uuid not null references public.session_subjects (id) on delete cascade,
  label               text not null,
  detail              text,
  estimated_minutes   integer,
  standard_only       boolean not null default false,
  is_optional         boolean not null default false,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now()
);

-- Resources must have a real URL. No blank links reach the UI.
create table public.resources (
  id                  uuid primary key default gen_random_uuid(),
  session_subject_id  uuid references public.session_subjects (id) on delete cascade,
  chapter_id          uuid references public.chapters (id) on delete cascade,
  kind                resource_kind not null default 'other',
  label               text not null,
  url                 text not null check (url ~* '^https?://'),
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  constraint resources_attached_to_something
    check (session_subject_id is not null or chapter_id is not null)
);

create index chapters_subject_idx on public.chapters (subject_id, number);
create index chapters_weightage_idx on public.chapters (board_weightage desc);
create index sessions_date_idx on public.sessions (scheduled_date);
create index sessions_phase_idx on public.sessions (phase);
create index session_subjects_session_idx on public.session_subjects (session_id, sort_order);
create index session_subjects_subject_idx on public.session_subjects (subject_id);
create index session_subjects_chapter_idx on public.session_subjects (chapter_id);
create index checklist_items_parent_idx on public.checklist_items (session_subject_id, sort_order);
create index resources_session_subject_idx on public.resources (session_subject_id, sort_order);
create index resources_chapter_idx on public.resources (chapter_id);
