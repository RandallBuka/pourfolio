-- Run in Supabase SQL editor to enable Google sign-in cloud sync for Pourfolio.

-- Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in GitHub Actions secrets (or .env locally).

-- Enable Google provider under Authentication → Providers in the Supabase dashboard.



create table if not exists public.pourfolio_sync (

  user_id uuid primary key references auth.users(id) on delete cascade,

  payload text not null,

  sync_updated_at bigint not null default 0,

  updated_at timestamptz not null default now()

);



alter table public.pourfolio_sync enable row level security;



create policy "Users read own sync"

  on public.pourfolio_sync for select

  to authenticated

  using (auth.uid() = user_id);



create policy "Users insert own sync"

  on public.pourfolio_sync for insert

  to authenticated

  with check (auth.uid() = user_id);



create policy "Users update own sync"

  on public.pourfolio_sync for update

  to authenticated

  using (auth.uid() = user_id)

  with check (auth.uid() = user_id);

