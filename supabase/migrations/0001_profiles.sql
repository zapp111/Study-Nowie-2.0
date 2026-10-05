-- Study Nowie 2.0 — profiles and roles
-- Every account is either a student or an admin. Role lives here, never in the client.

create extension if not exists "pgcrypto";

create type user_role as enum ('student', 'admin');
create type maths_level as enum ('basic', 'standard');
create type theme_preference as enum ('light', 'dark', 'system');

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text,
  display_name   text        not null default 'Student',
  role           user_role   not null default 'student',
  class_level    text        not null default '10',
  maths_level    maths_level not null default 'basic',
  theme          theme_preference not null default 'light',
  exam_date      date        not null default '2026-02-17',
  daily_goal_minutes integer not null default 150 check (daily_goal_minutes between 15 and 720),
  onboarded      boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is 'One row per account. Mirrors auth.users and carries role plus study preferences.';
comment on column public.profiles.exam_date is 'First board paper. Drives every countdown and pacing calculation.';

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- A profile is created automatically whenever an account is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'student'), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check used by every admin policy. Security definer so it can read profiles
-- without tripping the policies defined on profiles itself.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create index profiles_role_idx on public.profiles (role);
