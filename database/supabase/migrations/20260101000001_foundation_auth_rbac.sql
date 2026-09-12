-- ============================================================================
-- MIGRATION 01: FOUNDATION, MULTI-TENANCY, AUTH & RBAC
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. INSTITUSI SEKOLAH (TENANT PARENT)
-- ----------------------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npsn text unique,
  education_level text not null default 'SMA' check (education_level in ('SD', 'SMP', 'SMA', 'SMK', 'Umum')),
  address text,
  city text,
  province text,
  postal_code text,
  phone text,
  email text,
  website text,
  is_active boolean not null default true,
  maintenance_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_schools_is_active on public.schools(is_active);

-- ----------------------------------------------------------------------------
-- 2. ROLES & PERMISSIONS (RBAC)
-- ----------------------------------------------------------------------------
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  module text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(role_id, permission_id)
);

create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);
create index if not exists idx_role_permissions_permission_id on public.role_permissions(permission_id);

-- ----------------------------------------------------------------------------
-- 3. USERS (PLATFORM & TENANT SCOPED)
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  school_id uuid references public.schools(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  email text not null,
  username text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_users_email_ci on public.users(lower(email));
create unique index if not exists uq_users_username_ci on public.users(lower(username));
create index if not exists idx_users_role_school on public.users(role_id, school_id);
create index if not exists idx_users_school_status on public.users(school_id, status);
create index if not exists idx_users_auth_user_id on public.users(auth_user_id);

-- ----------------------------------------------------------------------------
-- 4. USER PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null,
  gender text check (gender in ('L', 'P')),
  phone text,
  avatar_url text,
  nis text,
  nisn text,
  nip text,
  nuptk text,
  birth_date date,
  birth_place text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);

-- ----------------------------------------------------------------------------
-- 5. HELPER SECURITY & CONTEXT FUNCTIONS (STABLE & FAST)
-- ----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_app_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.school_id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.id = u.role_id
    where u.auth_user_id = auth.uid()
      and r.name = 'super_admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 6. PRIVILEGE ESCALATION TRIGGER (PROTECT ROLES & TENANT MAPPING)
-- ----------------------------------------------------------------------------
create or replace function public.assert_users_escalation_protection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_is_super_admin boolean;
  target_super_admin_role_id uuid;
begin
  -- Bypass for background jobs or super admin users
  select public.is_super_admin() into acting_is_super_admin;
  if acting_is_super_admin or auth.uid() is null then
    return new;
  end if;

  select id into target_super_admin_role_id
  from public.roles
  where name = 'super_admin';

  -- Non-super-admin cannot create or assign super_admin role
  if new.role_id = target_super_admin_role_id then
    raise exception 'Hanya Super Admin yang dapat menetapkan peran Super Admin.';
  end if;

  -- Non-super-admin cannot change someone to another school
  if tg_op = 'UPDATE' and old.school_id is distinct from new.school_id then
    raise exception 'Tidak dapat memindahkan pengguna ke sekolah lain.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_assert_users_escalation on public.users;
create trigger trg_assert_users_escalation
before insert or update on public.users
for each row execute function public.assert_users_escalation_protection();
