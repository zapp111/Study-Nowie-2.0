-- A personal note from the admin, shown at the top of her dashboard.
--
-- Kept as a list rather than a single row so an older note is never lost when a
-- new one is written. The newest active row is the one she sees; clearing just
-- deactivates it, so nothing is destroyed by accident.

create table public.greetings (
  id          uuid primary key default gen_random_uuid(),
  message     text not null check (char_length(trim(message)) between 1 and 1000),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger greetings_touch_updated_at
  before update on public.greetings
  for each row execute function public.touch_updated_at();

-- Newest-first lookups of the one she should see.
create index greetings_active_idx on public.greetings (is_active, created_at desc);

alter table public.greetings enable row level security;

-- Same shape as the curriculum tables: anyone signed in may read, admins write.
create policy "read greetings" on public.greetings
  for select to authenticated using (true);

create policy "admins manage greetings" on public.greetings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
