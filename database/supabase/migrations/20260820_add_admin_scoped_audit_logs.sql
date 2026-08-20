-- =========================================================================
-- Sprint: Hardening Admin Audit Logs
-- Scope: Add audit_logs.view permission to admin and RLS to limit visibility
-- =========================================================================

-- 1. Grant audit_logs.view permission to admin role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'admin'
and p.code = 'audit_logs.view'
on conflict do nothing;

-- 2. Drop existing policy if it exists (for idempotency)
drop policy if exists audit_logs_select_admin_v2 on public.audit_logs;

-- 3. Create scoped SELECT policy for admin
create policy audit_logs_select_admin_v2 on public.audit_logs
for select using (
  public.current_app_role_name() = 'admin'
  and user_id in (
    select id from public.users where school_id = public.current_app_school_id()
  )
);
