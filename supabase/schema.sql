-- ============================================================
-- Andemar — esquema inicial (Fase 1 / MVP)
-- Correr en el SQL Editor de tu proyecto de Supabase, en orden:
--   1) schema.sql
--   2) seed.sql
-- ============================================================

create extension if not exists "uuid-ossp";

create type user_role as enum ('traveler', 'seller');
create type booking_status as enum ('pending', 'confirmed', 'cancelled');
create type tour_category as enum ('playa', 'isla', 'montana');

-- Un perfil por usuario autenticado (1-a-1 con auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'traveler',
  referral_code text unique not null default substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
  created_at timestamptz not null default now()
);

-- Catálogo de tours
create table tours (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  category tour_category not null,
  location text not null,
  price_cop integer not null,
  rating numeric(2, 1) not null default 5.0,
  cover_color text not null default '#0E7C90', -- bloque de color mientras no hay fotos reales
  video_360_url text,
  includes text[] not null default '{}',
  description text,
  commission_pct numeric(4, 2) not null default 10.00,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Reservas (permite invitados sin cuenta: traveler_id puede ser null)
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  tour_id uuid not null references tours(id) on delete cascade,
  traveler_id uuid references profiles(id),
  referrer_id uuid references profiles(id), -- vendedor/embajador que trajo la venta
  customer_name text not null,
  customer_phone text not null,
  people_count integer not null default 1,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Comisiones: se calculan a partir de bookings + tours, nunca se guardan
-- por separado (así nunca quedan desincronizadas). security_invoker hace que
-- la vista respete las políticas RLS de bookings.
create view seller_commissions
with (security_invoker = true) as
select
  b.referrer_id as seller_id,
  t.id as tour_id,
  t.title as tour_title,
  t.commission_pct,
  count(*) filter (where b.status = 'confirmed') as bookings_confirmed,
  coalesce(sum(t.price_cop * t.commission_pct / 100.0) filter (where b.status = 'confirmed'), 0) as commission_cop
from bookings b
join tours t on t.id = b.tour_id
where b.referrer_id is not null
group by b.referrer_id, t.id, t.title, t.commission_pct;

-- ============================================================
-- Row Level Security — revisa y ajusta antes de producción
-- ============================================================
alter table profiles enable row level security;
alter table tours enable row level security;
alter table bookings enable row level security;

create policy "profiles: cada quien lee su propio perfil"
  on profiles for select using (auth.uid() = id);

create policy "profiles: cada quien crea su propio perfil"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles: cada quien actualiza su propio perfil"
  on profiles for update using (auth.uid() = id);

create policy "tours: lectura publica de tours activos"
  on tours for select using (active = true);
-- Nota: a proposito no hay policy de insert/update para tours en la Fase 1.
-- Se cargan/editan desde el SQL Editor o el dashboard de Supabase hasta que
-- exista un panel de administrador (ver ROADMAP en el README).

create policy "bookings: cualquiera puede reservar (incluye invitados)"
  on bookings for insert with check (true);

create policy "bookings: el viajero o el vendedor referente ven sus reservas"
  on bookings for select using (auth.uid() = traveler_id or auth.uid() = referrer_id);
