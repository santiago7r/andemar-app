-- ============================================================
-- Andemar — Fase 2 (login real, pagos con Wompi, panel de administrador)
-- Correr en el SQL Editor DESPUÉS de schema.sql y seed.sql.
-- Se puede correr más de una vez sin romper nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Perfiles: se crean solos al registrarse
-- ------------------------------------------------------------

-- Administradores: columna aparte en vez de un tercer rol, para que nadie
-- pueda volverse admin desde el formulario de registro.
alter table profiles add column if not exists is_admin boolean not null default false;

-- Crea el perfil a partir de los datos que manda signUp() en options.data.
-- Solo acepta 'seller' o 'traveler'; cualquier otro valor queda como viajero.
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
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuarios que se registraron antes de que existiera el trigger
insert into profiles (id, full_name, role)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)),
  case when u.raw_user_meta_data ->> 'role' = 'seller' then 'seller'::user_role
       else 'traveler'::user_role end
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- El usuario solo puede cambiar su nombre. Rol, código de referido e is_admin
-- no se tocan desde la app (antes cualquiera podía cambiarse el rol).
drop policy if exists "profiles: cada quien crea su propio perfil" on profiles;
revoke insert, update on profiles from anon, authenticated;
grant update (full_name) on profiles to authenticated;

-- ------------------------------------------------------------
-- 2. Helpers
-- ------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Busca al vendedor de un código de referido. La página del tour lo necesita
-- sin sesión, y RLS no deja leer perfiles ajenos (por eso ?ref= no funcionaba).
create or replace function public.seller_id_for_referral_code(code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where referral_code = code and role = 'seller';
$$;

grant execute on function public.seller_id_for_referral_code(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3. Panel de administrador: tours
-- ------------------------------------------------------------

drop policy if exists "tours: admin lee todos" on tours;
create policy "tours: admin lee todos"
  on tours for select using (public.is_admin());

drop policy if exists "tours: admin crea" on tours;
create policy "tours: admin crea"
  on tours for insert with check (public.is_admin());

drop policy if exists "tours: admin edita" on tours;
create policy "tours: admin edita"
  on tours for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- 4. Pagos con Wompi
-- ------------------------------------------------------------
-- La referencia de pago en Wompi es el id de la reserva.

alter table bookings add column if not exists amount_cop integer;
alter table bookings add column if not exists wompi_transaction_id text;
alter table bookings add column if not exists wompi_status text;
alter table bookings add column if not exists paid_at timestamptz;

-- Las reservas ahora las crea el servidor (web/app/api/reservas) con el precio
-- calculado ahí, y solo el webhook de Wompi las pasa a 'confirmed'. Antes
-- cualquiera podía insertar una reserva ya 'confirmed' e inflar comisiones.
drop policy if exists "bookings: cualquiera puede reservar (incluye invitados)" on bookings;
revoke insert, update, delete on bookings from anon, authenticated;

drop policy if exists "bookings: admin lee todas" on bookings;
create policy "bookings: admin lee todas"
  on bookings for select using (public.is_admin());

-- ------------------------------------------------------------
-- 5. Hacerte administrador (corre esto una vez con tu correo)
-- ------------------------------------------------------------
-- update profiles set is_admin = true
-- where id = (select id from auth.users where email = 'tu@correo.com');
