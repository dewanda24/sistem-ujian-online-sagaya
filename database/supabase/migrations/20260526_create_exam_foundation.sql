-- Sprint 4: Exam Package & Scheduling Foundation
-- Scope: package, package questions, schedules, target classes, permissions.

create table if not exists public.exam_packages (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null references public.schools(id),
  subject_id uuid not null references public.subjects(id),
  created_by uuid references public.users(id),

  title text not null,
  description text,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  total_questions integer not null default 0 check (total_questions >= 0),
  total_points numeric not null default 0 check (total_points >= 0),

  status text not null default 'draft' check (
    status in ('draft', 'published', 'archived')
  ),

  shuffle_questions boolean not null default false,
  shuffle_options boolean not null default false,
  show_result boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_exam_packages_school_id
on public.exam_packages(school_id);

create index if not exists idx_exam_packages_subject_id
on public.exam_packages(subject_id);

create index if not exists idx_exam_packages_status
on public.exam_packages(status);

create index if not exists idx_exam_packages_is_active
on public.exam_packages(is_active);

create table if not exists public.exam_package_questions (
  id uuid primary key default gen_random_uuid(),

  exam_package_id uuid not null references public.exam_packages(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  order_number integer not null default 0,
  point_override numeric check (point_override is null or point_override > 0),

  created_at timestamptz not null default now()
);

create index if not exists idx_exam_package_questions_package_id
on public.exam_package_questions(exam_package_id);

create index if not exists idx_exam_package_questions_question_id
on public.exam_package_questions(question_id);

create unique index if not exists uq_exam_package_questions_package_question
on public.exam_package_questions(exam_package_id, question_id);

create table if not exists public.exam_schedules (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null references public.schools(id),
  exam_package_id uuid not null references public.exam_packages(id),
  academic_year_id uuid not null references public.academic_years(id),
  semester_id uuid references public.semesters(id),
  created_by uuid references public.users(id),

  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,

  status text not null default 'draft' check (
    status in ('draft', 'scheduled', 'active', 'finished', 'cancelled', 'archived')
  ),

  token_required boolean not null default false,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint exam_schedules_time_range check (end_at > start_at)
);

create index if not exists idx_exam_schedules_school_id
on public.exam_schedules(school_id);

create index if not exists idx_exam_schedules_package_id
on public.exam_schedules(exam_package_id);

create index if not exists idx_exam_schedules_academic_year_id
on public.exam_schedules(academic_year_id);

create index if not exists idx_exam_schedules_status
on public.exam_schedules(status);

create index if not exists idx_exam_schedules_start_at
on public.exam_schedules(start_at);

create table if not exists public.exam_schedule_classes (
  id uuid primary key default gen_random_uuid(),

  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  class_id uuid not null references public.classes(id),

  created_at timestamptz not null default now()
);

create index if not exists idx_exam_schedule_classes_schedule_id
on public.exam_schedule_classes(exam_schedule_id);

create index if not exists idx_exam_schedule_classes_class_id
on public.exam_schedule_classes(class_id);

create unique index if not exists uq_exam_schedule_classes_schedule_class
on public.exam_schedule_classes(exam_schedule_id, class_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_exam_packages_updated_at on public.exam_packages;
create trigger set_exam_packages_updated_at
before update on public.exam_packages
for each row
execute function public.set_updated_at();

drop trigger if exists set_exam_schedules_updated_at on public.exam_schedules;
create trigger set_exam_schedules_updated_at
before update on public.exam_schedules
for each row
execute function public.set_updated_at();

insert into public.permissions (code, module, action)
values
  ('exams.view', 'exams', 'view'),
  ('exam_packages.view', 'exam_packages', 'view'),
  ('exam_packages.manage', 'exam_packages', 'manage'),
  ('exam_packages.publish', 'exam_packages', 'publish'),
  ('exam_packages.archive', 'exam_packages', 'archive'),
  ('exam_schedules.view', 'exam_schedules', 'view'),
  ('exam_schedules.manage', 'exam_schedules', 'manage'),
  ('exam_schedules.publish', 'exam_schedules', 'publish'),
  ('exam_schedules.archive', 'exam_schedules', 'archive')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher')
and p.code in (
  'exams.view',
  'exam_packages.view',
  'exam_packages.manage',
  'exam_packages.publish',
  'exam_packages.archive',
  'exam_schedules.view',
  'exam_schedules.manage',
  'exam_schedules.publish',
  'exam_schedules.archive'
)
on conflict do nothing;
