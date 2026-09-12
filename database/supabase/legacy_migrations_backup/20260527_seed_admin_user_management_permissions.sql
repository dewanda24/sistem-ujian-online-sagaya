insert into public.permissions (code, module, action)
values
  ('users.view', 'users', 'view'),
  ('users.create', 'users', 'create'),
  ('users.update', 'users', 'update'),
  ('users.delete', 'users', 'delete')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
and p.code in ('users.view', 'users.create', 'users.update', 'users.delete')
on conflict do nothing;
