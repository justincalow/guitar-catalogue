-- Fretwork catalogue schema
-- Paste this entire file into the Supabase SQL Editor (Dashboard → SQL → New query)
-- and click Run. Safe to re-run: objects are created only if missing.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.guitars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  make text not null,
  model text not null,
  year integer,
  serial_number text not null default '',
  type text not null default 'electric'
    check (type in ('electric', 'acoustic', 'classical', 'bass', 'other')),
  colour text not null default '',
  strings integer not null default 6
    check (strings between 1 and 18),
  pickup_config text not null default '',
  purchase_date date,
  purchase_price numeric(12, 2),
  estimated_value numeric(12, 2),
  condition_notes text not null default '',
  notes text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guitars_year_range check (
    year is null or (year between 1800 and 2100)
  ),
  constraint guitars_purchase_price_nonneg check (
    purchase_price is null or purchase_price >= 0
  ),
  constraint guitars_estimated_value_nonneg check (
    estimated_value is null or estimated_value >= 0
  )
);

create index if not exists guitars_user_id_created_at_idx
  on public.guitars (user_id, created_at desc);

comment on table public.guitars is 'Personal guitar catalogue rows, scoped per auth user.';
comment on column public.guitars.photos is 'Storage object paths in the guitar-photos bucket.';

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guitars_set_updated_at on public.guitars;
create trigger guitars_set_updated_at
  before update on public.guitars
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owners only
-- ---------------------------------------------------------------------------

alter table public.guitars enable row level security;
alter table public.guitars force row level security;

drop policy if exists "Users can select own guitars" on public.guitars;
create policy "Users can select own guitars"
  on public.guitars
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own guitars" on public.guitars;
create policy "Users can insert own guitars"
  on public.guitars
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own guitars" on public.guitars;
create policy "Users can update own guitars"
  on public.guitars
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own guitars" on public.guitars;
create policy "Users can delete own guitars"
  on public.guitars
  for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.guitars from anon;
grant select, insert, update, delete on table public.guitars to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for guitar photos
-- Path convention: {user_id}/{guitar_id}/{filename}.jpg
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guitar-photos',
  'guitar-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view own guitar photos" on storage.objects;
create policy "Users can view own guitar photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'guitar-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can upload own guitar photos" on storage.objects;
create policy "Users can upload own guitar photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'guitar-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can update own guitar photos" on storage.objects;
create policy "Users can update own guitar photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'guitar-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'guitar-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete own guitar photos" on storage.objects;
create policy "Users can delete own guitar photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'guitar-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
