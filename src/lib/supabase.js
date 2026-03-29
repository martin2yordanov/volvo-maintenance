import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill in your values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── SQL to run once in Supabase SQL editor ───────────────────────────────────
//
// -- 1. Enable anonymous auth (no password needed)
// -- Go to Supabase Dashboard → Authentication → Providers → Anonymous → Enable
//
// -- 2. Run this SQL in the SQL Editor:
//
// create table if not exists maintenance_data (
//   id uuid primary key default gen_random_uuid(),
//   user_id uuid references auth.users(id) on delete cascade not null,
//   items jsonb not null default '[]'::jsonb,
//   odometer integer,
//   updated_at timestamptz default now() not null
// );
//
// -- Each user gets exactly one row
// create unique index if not exists maintenance_data_user_id_idx on maintenance_data(user_id);
//
// -- Row Level Security: users can only see/edit their own data
// alter table maintenance_data enable row level security;
//
// create policy "Users can read own data" on maintenance_data
//   for select using (auth.uid() = user_id);
//
// create policy "Users can insert own data" on maintenance_data
//   for insert with check (auth.uid() = user_id);
//
// create policy "Users can update own data" on maintenance_data
//   for update using (auth.uid() = user_id);
//
// -- Auto-update updated_at
// create or replace function update_updated_at()
// returns trigger as $$
// begin
//   new.updated_at = now();
//   return new;
// end;
// $$ language plpgsql;
//
// create trigger maintenance_data_updated_at
//   before update on maintenance_data
//   for each row execute function update_updated_at();
