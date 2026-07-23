create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.invitations enable row level security;

insert into storage.buckets (id, name, public)
values ('invitation-photos', 'invitation-photos', true)
on conflict (id) do update set public = true;

create policy "Public invitation photos are viewable"
on storage.objects for select
using (bucket_id = 'invitation-photos');
