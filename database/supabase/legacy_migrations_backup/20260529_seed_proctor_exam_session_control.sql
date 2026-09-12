-- Allow proctor users to perform guarded exam session controls from monitoring.
-- This does not change schema; it only completes RBAC assignment for the existing permission.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'proctor'
and p.code = 'exam_sessions.control'
on conflict do nothing;
