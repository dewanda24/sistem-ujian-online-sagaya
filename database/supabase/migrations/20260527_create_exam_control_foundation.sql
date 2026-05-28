-- Sprint 8: Token + Exam Session Control + Proctor Monitoring Foundation

alter table public.exam_schedules
add column if not exists access_token text;

alter table public.exam_schedules
add column if not exists token_updated_at timestamptz;

create index if not exists idx_exam_schedules_access_token
on public.exam_schedules(access_token);

insert into public.permissions (code, module, action)
values
  ('exam_tokens.manage', 'exam_tokens', 'manage'),
  ('exam_monitoring.view', 'exam_monitoring', 'view'),
  ('exam_sessions.control', 'exam_sessions', 'control')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher')
and p.code in ('exam_tokens.manage', 'exam_sessions.control')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher', 'proctor')
and p.code in ('exam_monitoring.view')
on conflict do nothing;
