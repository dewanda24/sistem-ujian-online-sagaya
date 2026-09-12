-- Fix RLS functions crashing due to ::jsonb casting
-- Using auth.jwt() which is the safest and recommended way to get claims.

begin;

create or replace function public.current_app_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (nullif(auth.jwt() -> 'app_metadata' ->> 'school_id', ''))::uuid,
    (
      select u.school_id
      from public.users u
      where u.auth_user_id = auth.uid()
      limit 1
    )
  )
$$;

create or replace function public.current_app_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    (
      select r.name
      from public.users u
      join public.roles r on r.id = u.role_id
      where u.auth_user_id = auth.uid()
      limit 1
    )
  )
$$;

commit;
