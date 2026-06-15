insert into public.permissions (code, module, action)
values
  ('master_data.view', 'master_data', 'view'),
  ('academic_years.view', 'academic_years', 'view'),
  ('academic_years.manage', 'academic_years', 'manage'),
  ('semesters.view', 'semesters', 'view'),
  ('semesters.manage', 'semesters', 'manage'),
  ('classes.view', 'classes', 'view'),
  ('classes.manage', 'classes', 'manage'),
  ('subjects.view', 'subjects', 'view'),
  ('subjects.manage', 'subjects', 'manage'),
  ('teachers.view', 'teachers', 'view'),
  ('teachers.manage', 'teachers', 'manage'),
  ('students.view', 'students', 'view'),
  ('students.manage', 'students', 'manage')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
and p.code in (
  'master_data.view',
  'academic_years.view',
  'academic_years.manage',
  'semesters.view',
  'semesters.manage',
  'classes.view',
  'classes.manage',
  'subjects.view',
  'subjects.manage',
  'teachers.view',
  'teachers.manage',
  'students.view',
  'students.manage'
)
on conflict do nothing;
