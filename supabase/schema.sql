-- Run in Supabase SQL editor to enable hosted cloud sync for Pourfolio.
-- Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.

create table if not exists public.pourfolio_sync (
  room_id text primary key,
  payload text not null,
  sync_updated_at bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.pourfolio_sync enable row level security;

create policy "Allow anon read write pourfolio_sync"
  on public.pourfolio_sync
  for all
  to anon
  using (true)
  with check (true);
