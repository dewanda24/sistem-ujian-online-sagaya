create table if not exists public.exam_proctors (
  id uuid primary key default gen_random_uuid(),
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  is_active boolean not null default true,
  notes text,
  unique (exam_schedule_id, teacher_id)
);

create index if not exists exam_proctors_schedule_idx
  on public.exam_proctors(exam_schedule_id);

create index if not exists exam_proctors_teacher_idx
  on public.exam_proctors(teacher_id);

create index if not exists exam_proctors_school_idx
  on public.exam_proctors(school_id);

create index if not exists exam_proctors_active_teacher_idx
  on public.exam_proctors(teacher_id, is_active);
