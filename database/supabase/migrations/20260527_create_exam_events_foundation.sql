-- Sprint 9: Exam Room Hardening + Anti-Cheat Event Foundation

create table if not exists public.exam_events (
  id uuid primary key default gen_random_uuid(),

  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  exam_schedule_id uuid references public.exam_schedules(id) on delete cascade,
  student_id uuid references public.users(id),

  event_type text not null check (
    event_type in (
      'tab_blur',
      'tab_focus',
      'visibility_hidden',
      'visibility_visible',
      'copy_attempt',
      'paste_attempt',
      'fullscreen_exit',
      'before_unload'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

create index if not exists idx_exam_events_attempt_id
on public.exam_events(exam_attempt_id);

create index if not exists idx_exam_events_schedule_id
on public.exam_events(exam_schedule_id);

create index if not exists idx_exam_events_student_id
on public.exam_events(student_id);

create index if not exists idx_exam_events_event_type
on public.exam_events(event_type);

alter table public.exam_participants
drop constraint if exists exam_participants_status_check;

alter table public.exam_participants
add constraint exam_participants_status_check check (
  status in ('assigned', 'in_progress', 'submitted', 'expired', 'absent', 'cancelled')
);

insert into public.permissions (code, module, action)
values
  ('exam_events.view', 'exam_events', 'view')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher', 'proctor')
and p.code in ('exam_events.view')
on conflict do nothing;
