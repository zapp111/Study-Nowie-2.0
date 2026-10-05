-- Study Nowie 2.0 — row level security
--
-- Two shapes of rule:
--   Curriculum tables  : any signed-in user may read; only admins may write.
--   Personal tables    : a user may only ever touch their own rows; admins may read
--                        them too, so progress can be reviewed from the admin panel.

alter table public.profiles             enable row level security;
alter table public.subjects             enable row level security;
alter table public.chapters             enable row level security;
alter table public.sessions             enable row level security;
alter table public.session_subjects     enable row level security;
alter table public.checklist_items      enable row level security;
alter table public.resources            enable row level security;
alter table public.quizzes              enable row level security;
alter table public.quiz_questions       enable row level security;
alter table public.quiz_attempts        enable row level security;
alter table public.question_bank        enable row level security;
alter table public.previous_year_papers enable row level security;
alter table public.checklist_progress   enable row level security;
alter table public.chapter_progress     enable row level security;
alter table public.mistakes             enable row level security;
alter table public.test_scores          enable row level security;
alter table public.study_log            enable row level security;

-- ---------------------------------------------------------------- profiles
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "admins update any profile" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Role escalation guard: a student cannot promote themselves to admin.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- ------------------------------------------------------------- curriculum
-- Readable by anyone signed in, writable only by admins.
do $$
declare t text;
begin
  foreach t in array array[
    'subjects', 'chapters', 'sessions', 'session_subjects',
    'checklist_items', 'resources', 'quizzes', 'quiz_questions',
    'question_bank', 'previous_year_papers'
  ]
  loop
    execute format(
      'create policy "read %1$s" on public.%1$I for select to authenticated using (true)', t
    );
    execute format(
      'create policy "admins manage %1$s" on public.%1$I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t
    );
  end loop;
end
$$;

-- --------------------------------------------------------------- personal
do $$
declare t text;
begin
  foreach t in array array[
    'quiz_attempts', 'checklist_progress', 'chapter_progress',
    'mistakes', 'test_scores', 'study_log'
  ]
  loop
    execute format(
      'create policy "read own %1$s" on public.%1$I for select to authenticated
         using (user_id = auth.uid() or public.is_admin())', t
    );
    execute format(
      'create policy "insert own %1$s" on public.%1$I for insert to authenticated
         with check (user_id = auth.uid())', t
    );
    execute format(
      'create policy "update own %1$s" on public.%1$I for update to authenticated
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t
    );
    execute format(
      'create policy "delete own %1$s" on public.%1$I for delete to authenticated
         using (user_id = auth.uid())', t
    );
  end loop;
end
$$;
