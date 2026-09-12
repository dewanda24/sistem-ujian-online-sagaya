-- ============================================================================
-- MIGRATION 04: CBT EXAM ENGINE (EXECUTION, PROCTORING & SCORING)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAKET NASKAH UJIAN
-- ----------------------------------------------------------------------------
create table if not exists public.exam_packages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  code text not null,
  duration_minutes integer not null default 60,
  total_questions integer not null default 0,
  passing_score numeric not null default 75,
  status text not null default 'draft' check (status in ('draft', 'ready', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_packages_school on public.exam_packages(school_id);
create index if not exists idx_exam_packages_subject on public.exam_packages(subject_id);

create table if not exists public.exam_package_questions (
  id uuid primary key default gen_random_uuid(),
  exam_package_id uuid not null references public.exam_packages(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  order_index integer not null default 0,
  points numeric not null default 1,
  created_at timestamptz not null default now(),
  unique(exam_package_id, question_id)
);

create index if not exists idx_exam_package_questions_pkg on public.exam_package_questions(exam_package_id);

-- ----------------------------------------------------------------------------
-- 2. JADWAL UJIAN (EXAM SCHEDULES)
-- ----------------------------------------------------------------------------
create table if not exists public.exam_schedules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_package_id uuid not null references public.exam_packages(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  semester_id uuid not null references public.semesters(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  token text not null,
  token_expired_at timestamptz,
  duration_minutes integer,
  shuffle_questions boolean not null default true,
  shuffle_options boolean not null default true,
  show_results boolean not null default false,
  allow_review boolean not null default false,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'active', 'finished', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_schedules_school on public.exam_schedules(school_id);
create index if not exists idx_exam_schedules_status on public.exam_schedules(status);
create index if not exists idx_exam_schedules_start on public.exam_schedules(start_at);

create table if not exists public.exam_schedule_classes (
  id uuid primary key default gen_random_uuid(),
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(exam_schedule_id, class_id)
);

create index if not exists idx_exam_schedule_classes_schedule on public.exam_schedule_classes(exam_schedule_id);

-- ----------------------------------------------------------------------------
-- 3. PENGAWAS UJIAN (PROCTORS)
-- ----------------------------------------------------------------------------
create table if not exists public.exam_proctors (
  id uuid primary key default gen_random_uuid(),
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(exam_schedule_id, teacher_id)
);

create index if not exists idx_exam_proctors_schedule on public.exam_proctors(exam_schedule_id);
create index if not exists idx_exam_proctors_teacher on public.exam_proctors(teacher_id);

-- ----------------------------------------------------------------------------
-- 4. PESERTA & SESI PENGERJAAN (PARTICIPANTS & ATTEMPTS)
-- ----------------------------------------------------------------------------
create table if not exists public.exam_participants (
  id uuid primary key default gen_random_uuid(),
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned', 'registered', 'in_progress', 'submitted', 'expired', 'absent', 'cancelled', 'completed', 'blocked')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_schedule_id, student_id)
);

create index if not exists idx_exam_participants_schedule on public.exam_participants(exam_schedule_id);
create index if not exists idx_exam_participants_student on public.exam_participants(student_id);
create index if not exists idx_exam_participants_assigned_at on public.exam_participants(assigned_at desc);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_participant_id uuid not null references public.exam_participants(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  exam_schedule_id uuid not null references public.exam_schedules(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  last_saved_at timestamptz,
  last_activity_at timestamptz,
  score numeric,
  auto_score numeric,
  essay_score numeric,
  max_score numeric,
  total_questions integer not null default 0,
  answered_questions integer not null default 0,
  correct_answers integer not null default 0,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'graded', 'abandoned', 'locked', 'expired', 'cancelled')),
  grading_status text not null default 'ungraded' check (grading_status in ('ungraded', 'partial', 'graded', 'pending', 'auto_scored', 'needs_manual_grading', 'finalized')),
  ip_address text,
  user_agent text,
  locked_at timestamptz,
  lock_reason text,
  active_session_id text,
  active_session_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_exam_attempts_participant on public.exam_attempts(exam_participant_id);
create index if not exists idx_exam_attempts_student on public.exam_attempts(student_id);
create index if not exists idx_exam_attempts_schedule on public.exam_attempts(exam_schedule_id);
create index if not exists idx_exam_attempts_status on public.exam_attempts(status);

-- ----------------------------------------------------------------------------
-- 5. LEMBAR JAWABAN & EVENT TELEMETRI
-- ----------------------------------------------------------------------------
create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_option_id uuid references public.question_options(id) on delete set null,
  essay_answer text,
  score numeric,
  max_score numeric,
  awarded_score numeric,
  is_correct boolean,
  needs_manual_grading boolean not null default false,
  teacher_note text,
  graded_by uuid references public.users(id) on delete set null,
  graded_at timestamptz,
  marked_for_review boolean not null default false,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_attempt_id, question_id)
);

create index if not exists idx_exam_answers_attempt on public.exam_answers(exam_attempt_id);

create table if not exists public.exam_events (
  id uuid primary key default gen_random_uuid(),
  exam_attempt_id uuid not null references public.exam_attempts(id) on delete cascade,
  exam_schedule_id uuid references public.exam_schedules(id) on delete cascade,
  student_id uuid references public.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_exam_events_attempt on public.exam_events(exam_attempt_id);
create index if not exists idx_exam_events_schedule on public.exam_events(exam_schedule_id);
create index if not exists idx_exam_events_student on public.exam_events(student_id);
create index if not exists idx_exam_events_type on public.exam_events(event_type);
