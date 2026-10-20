-- Fretwork inventory columns: guitars and amps, sale status, CAD values, insurance.
-- Run the original guitars migration first if public.guitars does not exist yet.
-- Paste this entire file into the Supabase SQL Editor (Dashboard → SQL → New query)
-- and click Run. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

alter table public.guitars add column if not exists name text not null default '';
alter table public.guitars add column if not exists item_kind text not null default 'guitar';
alter table public.guitars add column if not exists status text not null default 'keeping';
alter table public.guitars add column if not exists list_price numeric(12, 2);
alter table public.guitars add column if not exists floor_price numeric(12, 2);
alter table public.guitars add column if not exists value_range text not null default '';
alter table public.guitars add column if not exists insurance_low numeric(12, 2);
alter table public.guitars add column if not exists insurance_high numeric(12, 2);
alter table public.guitars add column if not exists insurance_value text not null default '';
alter table public.guitars add column if not exists insurance_basis text not null default '';
alter table public.guitars add column if not exists insurance_confidence text not null default '';
alter table public.guitars add column if not exists quantity integer not null default 1;
alter table public.guitars add column if not exists details text not null default '';
alter table public.guitars add column if not exists sold_date date;
alter table public.guitars add column if not exists sold_price numeric(12, 2);

-- Amps do not have a string count. Existing guitar rows keep their value.
alter table public.guitars alter column strings drop not null;

-- ---------------------------------------------------------------------------
-- Checks (drop + add so re-runs stay in sync)
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'guitars'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%strings%'
  loop
    execute format('alter table public.guitars drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.guitars
  add constraint guitars_strings_check
  check (strings is null or (strings between 1 and 18));

alter table public.guitars drop constraint if exists guitars_item_kind_check;
alter table public.guitars
  add constraint guitars_item_kind_check
  check (item_kind in ('guitar', 'amp'));

alter table public.guitars drop constraint if exists guitars_status_check;
alter table public.guitars
  add constraint guitars_status_check
  check (status in ('for_sale', 'keeping', 'tbd', 'sold'));

alter table public.guitars drop constraint if exists guitars_quantity_check;
alter table public.guitars
  add constraint guitars_quantity_check
  check (quantity >= 0 and quantity <= 9999);

alter table public.guitars drop constraint if exists guitars_list_price_nonneg;
alter table public.guitars
  add constraint guitars_list_price_nonneg
  check (list_price is null or list_price >= 0);

alter table public.guitars drop constraint if exists guitars_floor_price_nonneg;
alter table public.guitars
  add constraint guitars_floor_price_nonneg
  check (floor_price is null or floor_price >= 0);

alter table public.guitars drop constraint if exists guitars_insurance_low_nonneg;
alter table public.guitars
  add constraint guitars_insurance_low_nonneg
  check (insurance_low is null or insurance_low >= 0);

alter table public.guitars drop constraint if exists guitars_insurance_high_nonneg;
alter table public.guitars
  add constraint guitars_insurance_high_nonneg
  check (insurance_high is null or insurance_high >= 0);

alter table public.guitars drop constraint if exists guitars_sold_price_nonneg;
alter table public.guitars
  add constraint guitars_sold_price_nonneg
  check (sold_price is null or sold_price >= 0);

create index if not exists guitars_user_id_status_idx
  on public.guitars (user_id, status);

comment on table public.guitars is 'Personal catalogue of guitars and amps, scoped per auth user.';
comment on column public.guitars.name is 'Catalogue title. CSV import stores the Item column here.';
comment on column public.guitars.item_kind is 'guitar or amp.';
comment on column public.guitars.status is 'for_sale, keeping, tbd, or sold.';
comment on column public.guitars.insurance_value is 'Free-text insurance or replacement figure, often a range.';
comment on column public.guitars.details is 'Short description from the inventory sheet (finish, specs).';
comment on column public.guitars.sold_date is 'Set when status is sold, so a sale stays in the catalogue.';
comment on column public.guitars.photos is 'Storage object paths in the guitar-photos bucket. CSV import does not set this.';

-- ---------------------------------------------------------------------------
-- Row Level Security stays owner-scoped. New columns use the same row policies.
-- ---------------------------------------------------------------------------

alter table public.guitars enable row level security;
alter table public.guitars force row level security;

revoke all on table public.guitars from anon;
grant select, insert, update, delete on table public.guitars to authenticated;
