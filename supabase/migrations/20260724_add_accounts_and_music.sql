alter table public.invitations
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create index if not exists invitations_owner_id_idx on public.invitations(owner_id);

insert into storage.buckets (id, name, public)
values ('invitation-music', 'invitation-music', true)
on conflict (id) do update set public = true;

drop policy if exists "Public invitation music is playable" on storage.objects;
create policy "Public invitation music is playable"
on storage.objects for select
using (bucket_id = 'invitation-music');
