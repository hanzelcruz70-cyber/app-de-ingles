-- =====================================================================
-- Pandi English · esquema de base de datos para Supabase
-- Ejecutar en un proyecto NUEVO de Supabase (SQL Editor → New query → Run).
-- Este script solo CREA tablas, funciones y reglas; no borra nada.
-- Se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tablas ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null check (role in ('admin','student')),
  username text not null unique,
  name text not null,
  group_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  school_id uuid not null references public.schools(id) on delete cascade,
  id text not null,
  name text not null,
  open jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  primary key (school_id, id)
);

create table if not exists public.courses (
  school_id uuid primary key references public.schools(id) on delete cascade,
  data jsonb not null,
  version int not null default 2,
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  school_id uuid not null references public.schools(id) on delete cascade,
  id text not null,
  title text not null,
  due date not null,
  lessons text[] not null default '{}',
  writing jsonb,
  groups text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (school_id, id)
);

create table if not exists public.progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  school_id uuid not null references public.schools(id) on delete cascade,
  assignment_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '',
  sent_at date,
  note text not null default '',
  reviewed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);

create index if not exists profiles_school_idx on public.profiles(school_id);
create index if not exists progress_school_idx on public.progress(school_id);
create index if not exists submissions_school_idx on public.submissions(school_id);

-- ---------- Funciones de ayuda (quién soy) ----------
create or replace function public.my_school() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.my_group() returns text
language sql stable security definer set search_path = public as $$
  select group_id from public.profiles where id = auth.uid()
$$;

-- Ranking del grupo del estudiante (solo nombre y puntos de sus compañeros)
create or replace function public.class_ranking()
returns table (user_id uuid, name text, xp int, xp_days jsonb, days jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.name,
         coalesce((pr.data->>'xp')::int, 0),
         coalesce(pr.data->'xpDays', '{}'::jsonb),
         coalesce(pr.data->'days', '[]'::jsonb)
  from public.profiles p
  left join public.progress pr on pr.user_id = p.id
  where p.role = 'student'
    and p.school_id = public.my_school()
    and p.group_id is not distinct from public.my_group()
$$;

-- Un estudiante no puede calificarse a sí mismo: solo el admin cambia nota y revisión
create or replace function public.guard_submission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.note := ''; new.reviewed := false;
    else
      new.note := old.note; new.reviewed := old.reviewed;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists submissions_guard on public.submissions;
create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.guard_submission();

-- ---------- Permisos ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.schools, public.groups, public.courses, public.assignments, public.progress, public.submissions to authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (name, group_id) on public.profiles to authenticated;
grant execute on function public.my_school(), public.is_admin(), public.my_group(), public.class_ranking() to authenticated;
revoke all on all tables in schema public from anon;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.courses enable row level security;
alter table public.assignments enable row level security;
alter table public.progress enable row level security;
alter table public.submissions enable row level security;

-- schools
drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to authenticated using (id = public.my_school());

-- profiles: el estudiante ve su perfil; el admin ve y edita (nombre, grupo) a los de su escuela
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or (public.is_admin() and school_id = public.my_school()));
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin() and school_id = public.my_school())
  with check (school_id = public.my_school());

-- groups, courses, assignments: todos los de la escuela leen; solo el admin escribe
do $$
declare t text;
begin
  foreach t in array array['groups','courses','assignments'] loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format('create policy %1$s_read on public.%1$s for select to authenticated using (school_id = public.my_school())', t);
    execute format('drop policy if exists %1$s_admin_write on public.%1$s', t);
    execute format('create policy %1$s_admin_write on public.%1$s for all to authenticated using (public.is_admin() and school_id = public.my_school()) with check (public.is_admin() and school_id = public.my_school())', t);
  end loop;
end $$;

-- progress: cada estudiante escribe el suyo; el admin lee los de su escuela
drop policy if exists progress_read on public.progress;
create policy progress_read on public.progress for select to authenticated
  using (user_id = auth.uid() or (public.is_admin() and school_id = public.my_school()));
drop policy if exists progress_own_insert on public.progress;
create policy progress_own_insert on public.progress for insert to authenticated
  with check (user_id = auth.uid() and school_id = public.my_school());
drop policy if exists progress_own_update on public.progress;
create policy progress_own_update on public.progress for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and school_id = public.my_school());

-- submissions: el estudiante escribe la suya mientras no esté revisada; el admin revisa las de su escuela
drop policy if exists submissions_read on public.submissions;
create policy submissions_read on public.submissions for select to authenticated
  using (user_id = auth.uid() or (public.is_admin() and school_id = public.my_school()));
drop policy if exists submissions_own_insert on public.submissions;
create policy submissions_own_insert on public.submissions for insert to authenticated
  with check (user_id = auth.uid() and school_id = public.my_school());
drop policy if exists submissions_own_update on public.submissions;
create policy submissions_own_update on public.submissions for update to authenticated
  using (user_id = auth.uid() and not reviewed) with check (user_id = auth.uid() and school_id = public.my_school());
drop policy if exists submissions_admin_update on public.submissions;
create policy submissions_admin_update on public.submissions for update to authenticated
  using (public.is_admin() and school_id = public.my_school()) with check (school_id = public.my_school());
