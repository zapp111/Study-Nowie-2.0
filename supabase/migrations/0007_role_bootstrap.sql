-- Study Nowie 2.0 — let the first admin exist
--
-- The escalation guard asked "is the caller already an admin?", which is false
-- for everyone before the first admin is created, so the role could never be
-- set. A statement run from the SQL editor or with the service key has no
-- signed-in user at all, and whoever holds those already has full access, so
-- treat the absence of a user as trusted and only police real sessions.

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change a role';
  end if;
  return new;
end;
$$;

-- Convenience for setting up a new project: promote by email in one call.
create or replace function public.promote_to_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  hit integer;
begin
  update public.profiles set role = 'admin' where lower(email) = lower(trim(target_email));
  get diagnostics hit = row_count;

  if hit = 0 then
    return format('No account found for %s. Sign up first, then run this again.', target_email);
  end if;

  return format('%s is now an admin. Sign out and back in to see it.', target_email);
end;
$$;

revoke execute on function public.promote_to_admin(text) from anon, authenticated;

-- To make admin now--
select public.promote_to_admin('her@email.com');
