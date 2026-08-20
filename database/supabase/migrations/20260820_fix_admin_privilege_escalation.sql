-- Fix Privilege Escalation vulnerability on public.users
-- This prevents a school admin from escalating their role to super_admin
-- or taking over other accounts via auth_user_id manipulation.

begin;

create or replace function public.assert_users_escalation_protection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  super_admin_role_id uuid;
begin
  if not public.current_app_is_super_admin() then
    
    -- Prevent any non super_admin from changing auth_user_id
    if tg_op = 'UPDATE' and old.auth_user_id is distinct from new.auth_user_id then
      raise exception 'Only super_admin can change auth mapping';
    end if;
    
    -- Prevent any non super_admin from moving a user to another school
    if tg_op = 'UPDATE' and old.school_id is distinct from new.school_id then
      raise exception 'Only super_admin can change user school';
    end if;
    
    -- Prevent any non super_admin from granting super_admin role on INSERT or UPDATE
    if (tg_op = 'INSERT' and new.role_id is not null) or (tg_op = 'UPDATE' and old.role_id is distinct from new.role_id) then
      select id into super_admin_role_id from public.roles where name = 'super_admin';
      if new.role_id = super_admin_role_id then
        raise exception 'Cannot assign super_admin role';
      end if;
    end if;
    
  end if;
  return new;
end;
$$;

drop trigger if exists assert_users_escalation_protection on public.users;
create trigger assert_users_escalation_protection
before insert or update on public.users
for each row execute function public.assert_users_escalation_protection();

commit;
