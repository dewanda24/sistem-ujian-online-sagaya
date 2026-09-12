-- Sprint 10: Reporting & Analytics Foundation

insert into public.permissions (code, module, action)
values
  ('reports.view', 'reports', 'view'),
  ('reports.export', 'reports', 'export'),
  ('analytics.view', 'analytics', 'view')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'principal')
and p.code in ('reports.view', 'reports.export', 'analytics.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'teacher'
and p.code in ('reports.view', 'reports.export')
on conflict do nothing;
