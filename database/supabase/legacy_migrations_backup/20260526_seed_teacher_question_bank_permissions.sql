-- Ensure teacher can access Bank Soal / Question Bank.
-- Idempotent seed only; no schema changes.

insert into public.permissions (code, module, action)
values
  ('dashboard.view', 'dashboard', 'view'),
  ('question_bank.view', 'question_bank', 'view'),
  ('question_bank.manage', 'question_bank', 'manage'),
  ('questions.create', 'questions', 'create'),
  ('questions.update', 'questions', 'update'),
  ('questions.publish', 'questions', 'publish'),
  ('questions.archive', 'questions', 'archive'),
  ('question_categories.manage', 'question_categories', 'manage')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'teacher'
and p.code in (
  'dashboard.view',
  'question_bank.view',
  'question_bank.manage',
  'questions.create',
  'questions.update',
  'questions.publish',
  'questions.archive',
  'question_categories.manage'
)
and not exists (
  select 1
  from public.role_permissions rp
  where rp.role_id = r.id
  and rp.permission_id = p.id
);
