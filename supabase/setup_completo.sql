-- ============================================================
-- Andemar — Configuración Completa de Perfiles y Reservas
-- Ejecutar en el SQL Editor de supabase.com (un solo clic)
-- ============================================================

-- 1. Asegurar columnas necesarias en profiles y bookings
alter table profiles add column if not exists is_admin boolean not null default false;
alter table bookings add column if not exists amount_cop integer not null default 0;

-- 2. Trigger para crear automáticamente el perfil en profiles al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role
         else 'traveler'::user_role end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sincronizar usuarios que ya se hayan creado previamente
insert into profiles (id, full_name, role)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
  case when u.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role
       else 'traveler'::user_role end
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 3. Función para obtener el ID del vendedor a partir del código de referido
create or replace function public.seller_id_for_referral_code(code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where referral_code = code and role = 'seller' limit 1;
$$;

grant execute on function public.seller_id_for_referral_code(text) to anon, authenticated, service_role;

-- 4. Actualizar la vista de comisiones para usar amount_cop o precio del tour
create or replace view seller_commissions
with (security_invoker = true) as
select
  b.referrer_id as seller_id,
  t.id as tour_id,
  t.title as tour_title,
  t.commission_pct,
  count(*) filter (where b.status = 'confirmed') as bookings_confirmed,
  coalesce(sum(case when b.amount_cop > 0 then b.amount_cop else t.price_cop * b.people_count end * t.commission_pct / 100.0) filter (where b.status = 'confirmed'), 0) as commission_cop
from bookings b
join tours t on t.id = b.tour_id
where b.referrer_id is not null
group by b.referrer_id, t.id, t.title, t.commission_pct;

-- 5. Políticas de seguridad (Row Level Security)
alter table profiles enable row level security;
alter table bookings enable row level security;
alter table tours enable row level security;

-- Perfiles
drop policy if exists "profiles: cada quien lee su propio perfil" on profiles;
create policy "profiles: cada quien lee su propio perfil"
  on profiles for select using (auth.uid() = id);

drop policy if exists "profiles: cada quien crea su propio perfil" on profiles;
create policy "profiles: cada quien crea su propio perfil"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles: cada quien actualiza su propio perfil" on profiles;
create policy "profiles: cada quien actualiza su propio perfil"
  on profiles for update using (auth.uid() = id);

-- Reservas
drop policy if exists "bookings: permitir crear reservas" on bookings;
create policy "bookings: permitir crear reservas"
  on bookings for insert with check (true);

drop policy if exists "bookings: el viajero o el vendedor referente ven sus reservas" on bookings;
create policy "bookings: el viajero o el vendedor referente ven sus reservas"
  on bookings for select using (auth.uid() = traveler_id or auth.uid() = referrer_id);
