-- HortiCheck Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Records table: stores QA and SA assessments as JSON, mirroring the
-- existing local IndexedDB structure so migration is a straight copy.
create table if not exists records (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  module text not null,              -- 'qa' | 'sa'
  data jsonb not null,                -- the full record object (siteInfo, zones, etc.)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Plant ID library: saved plant identifications
create table if not exists plant_library (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  image_src text,                     -- base64 data URL (kept simple for now)
  result jsonb not null,
  created_at timestamptz default now()
);

-- Row Level Security: each user can only see and modify their own data.
alter table records enable row level security;
alter table plant_library enable row level security;

create policy "Users can view own records"
  on records for select
  using (auth.uid() = user_id);

create policy "Users can insert own records"
  on records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own records"
  on records for update
  using (auth.uid() = user_id);

create policy "Users can delete own records"
  on records for delete
  using (auth.uid() = user_id);

create policy "Users can view own plant library"
  on plant_library for select
  using (auth.uid() = user_id);

create policy "Users can insert own plant library"
  on plant_library for insert
  with check (auth.uid() = user_id);

create policy "Users can update own plant library"
  on plant_library for update
  using (auth.uid() = user_id);

create policy "Users can delete own plant library"
  on plant_library for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger records_updated_at
  before update on records
  for each row execute function update_updated_at();
