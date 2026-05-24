-- ============================================================
-- Volvo V70 Maintenance App — Supabase Schema
-- Run this ONCE in your Supabase project → SQL Editor
-- ============================================================

-- 1. Create the table
create table if not exists maintenance_data (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  items       jsonb not null default '[]'::jsonb,
  odometer    integer,
  updated_at  timestamptz default now() not null
);

-- 2. One row per user (upsert target)
create unique index if not exists maintenance_data_user_id_idx
  on maintenance_data(user_id);

-- 3. Row Level Security — users only see their own data
alter table maintenance_data enable row level security;

create policy "Users can read own data"
  on maintenance_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on maintenance_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on maintenance_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own data"
  on maintenance_data for delete
  using (auth.uid() = user_id);

-- 4. Auto-update updated_at on every save
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger maintenance_data_updated_at
  before update on maintenance_data
  for each row execute function update_updated_at();

-- ============================================================
-- Done! Now enable Anonymous Auth in your Supabase dashboard:
-- Authentication → Providers → Anonymous → Enable
-- ============================================================

-- ============================================================
-- Car Share Links
-- ============================================================
create table if not exists car_shares (
  token       text primary key default replace(gen_random_uuid()::text, '-', ''),
  data        jsonb not null,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '90 days')
);
alter table car_shares enable row level security;
create policy "Public read active shares"
  on car_shares for select
  using (expires_at > now());
create policy "Authenticated insert"
  on car_shares for insert
  with check (true);

-- ============================================================
-- Weekly digest cron job (requires pg_cron extension)
-- Enable in Supabase: Database → Extensions → pg_cron
-- Then run:
-- ============================================================
-- select cron.schedule('weekly-digest', '0 8 * * 1', $$
--   select net.http_post(
--     url := 'https://YOUR-PROJECT.supabase.co/functions/v1/weekly-digest',
--     headers := '{"Authorization": "Bearer YOUR-ANON-KEY"}'::jsonb
--   );
-- $$);
