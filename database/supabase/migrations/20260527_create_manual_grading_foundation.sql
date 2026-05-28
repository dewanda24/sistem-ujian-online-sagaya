-- Sprint 7: Manual Essay Grading + Final Result
-- Scope: essay scoring audit fields and grading permissions.

alter table public.exam_answers
add column if not exists graded_by uuid references public.users(id);

alter table public.exam_answers
add column if not exists graded_at timestamptz;

insert into public.permissions (code, module, action)
values
  ('grading.manage', 'grading', 'manage'),
  ('exam_results.finalize', 'exam_results', 'finalize')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher')
and p.code in ('grading.manage', 'exam_results.finalize')
on conflict do nothing;
