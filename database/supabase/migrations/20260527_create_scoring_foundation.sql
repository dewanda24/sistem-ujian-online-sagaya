-- Sprint 6: Scoring & Result Foundation
-- Scope: automatic multiple-choice scoring, result status, and recap permissions.

alter table public.exam_attempts
add column if not exists grading_status text not null default 'pending' check (
  grading_status in ('pending', 'auto_scored', 'needs_manual_grading', 'finalized')
);

alter table public.exam_attempts
add column if not exists total_questions integer not null default 0;

alter table public.exam_attempts
add column if not exists answered_questions integer not null default 0;

alter table public.exam_attempts
add column if not exists correct_answers integer not null default 0;

alter table public.exam_attempts
add column if not exists max_score numeric not null default 0;

alter table public.exam_answers
add column if not exists is_correct boolean;

alter table public.exam_answers
add column if not exists max_score numeric;

alter table public.exam_answers
add column if not exists awarded_score numeric;

alter table public.exam_answers
add column if not exists needs_manual_grading boolean not null default false;

create index if not exists idx_exam_attempts_grading_status
on public.exam_attempts(grading_status);

insert into public.permissions (code, module, action)
values
  ('exam_results.view', 'exam_results', 'view'),
  ('exam_results.recap', 'exam_results', 'recap'),
  ('grading.view', 'grading', 'view')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'student'
and p.code in ('exam_results.view')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher')
and p.code in ('exam_results.view', 'exam_results.recap', 'grading.view')
on conflict do nothing;
