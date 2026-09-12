insert into public.permissions (code, module, action)
values
  ('import_export.view', 'import_export', 'view'),
  ('import_export.manage', 'import_export', 'manage')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
and p.code in ('import_export.view', 'import_export.manage')
on conflict do nothing;
