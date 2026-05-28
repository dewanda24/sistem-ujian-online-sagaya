-- Sprint 5: Exam Room & Student Attempt Foundation
-- Scope: participants, attempts, answers, student permissions.

create table if not exists public.exam_participants (
  id uuid primary key default gen_random_uuid(),

  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  student_id uuid not null references public.users(id),
  class_id uuid references public.classes(id),

  status text not null default 'assigned' check (
    status in ('assigned', 'in_progress', 'submitted', 'absent', 'cancelled')
  ),

  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_participants_schedule_id
on public.exam_participants(exam_schedule_id);

create index if not exists idx_exam_participants_student_id
on public.exam_participants(student_id);

create unique index if not exists uq_exam_participants_schedule_student
on public.exam_participants(exam_schedule_id, student_id);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),

  exam_participant_id uuid not null references public.exam_participants(id) on delete cascade,
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  student_id uuid not null references public.users(id),

  status text not null default 'in_progress' check (
    status in ('in_progress', 'submitted', 'expired', 'cancelled')
  ),

  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  last_saved_at timestamptz,

  score numeric,
  auto_score numeric,
  essay_score numeric,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_attempts_participant_id
on public.exam_attempts(exam_participant_id);

create index if not exists idx_exam_attempts_schedule_id
on public.exam_attempts(exam_schedule_id);

create index if not exists idx_exam_attempts_student_id
on public.exam_attempts(student_id);

create unique index if not exists uq_exam_attempts_participant_active
on public.exam_attempts(exam_participant_id)
where status = 'in_progress';

create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),

  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option_id uuid references public.question_options(id),
  essay_answer text,

  is_flagged boolean not null default false,
  answered_at timestamptz,
  saved_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_answers_attempt_id
on public.exam_answers(exam_attempt_id);

create index if not exists idx_exam_answers_question_id
on public.exam_answers(question_id);

create unique index if not exists uq_exam_answers_attempt_question
on public.exam_answers(exam_attempt_id, question_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_exam_participants_updated_at on public.exam_participants;
create trigger set_exam_participants_updated_at
before update on public.exam_participants
for each row
execute function public.set_updated_at();

drop trigger if exists set_exam_attempts_updated_at on public.exam_attempts;
create trigger set_exam_attempts_updated_at
before update on public.exam_attempts
for each row
execute function public.set_updated_at();

drop trigger if exists set_exam_answers_updated_at on public.exam_answers;
create trigger set_exam_answers_updated_at
before update on public.exam_answers
for each row
execute function public.set_updated_at();

insert into public.permissions (code, module, action)
values
  ('active_exams.view', 'active_exams', 'view'),
  ('exam_room.access', 'exam_room', 'access'),
  ('exam_attempts.start', 'exam_attempts', 'start'),
  ('exam_attempts.submit', 'exam_attempts', 'submit'),
  ('exam_answers.save', 'exam_answers', 'save')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
and p.code in (
  'active_exams.view',
  'exam_room.access',
  'exam_attempts.start',
  'exam_attempts.submit',
  'exam_answers.save'
)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'student'
and p.code in (
  'dashboard.view',
  'active_exams.view',
  'exam_room.access',
  'exam_attempts.start',
  'exam_attempts.submit',
  'exam_answers.save'
)
on conflict do nothing;
