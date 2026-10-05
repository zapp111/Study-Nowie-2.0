-- Study Nowie 2.0 — storage for question papers
-- Private bucket: signed-in users can read, only admins can upload or delete.

insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

create policy "signed in users read papers"
  on storage.objects for select to authenticated
  using (bucket_id = 'papers');

create policy "admins upload papers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'papers' and public.is_admin());

create policy "admins update papers"
  on storage.objects for update to authenticated
  using (bucket_id = 'papers' and public.is_admin())
  with check (bucket_id = 'papers' and public.is_admin());

create policy "admins delete papers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'papers' and public.is_admin());
