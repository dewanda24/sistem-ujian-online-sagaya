-- ============================================================================
-- MIGRATION 02: MASTER DATA AKADEMIK (TENANT SCOPED)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TAHUN AJARAN & SEMESTER
-- ----------------------------------------------------------------------------
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_academic_years_school_name on public.academic_years(school_id, lower(name));
create index if not exists idx_academic_years_school_active on public.academic_years(school_id, is_active);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  code text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_semesters_year_code on public.semesters(academic_year_id, lower(code));
create index if not exists idx_semesters_year_active on public.semesters(academic_year_id, is_active);

-- ----------------------------------------------------------------------------
-- 2. KELAS / ROMBEL
-- ----------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  grade_level text not null,
  major text,
  homeroom_teacher_id uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_classes_school_year_name on public.classes(school_id, academic_year_id, lower(name));
create index if not exists idx_classes_school_active on public.classes(school_id, is_active);
create index if not exists idx_classes_homeroom on public.classes(homeroom_teacher_id);

-- ----------------------------------------------------------------------------
-- 3. MATA PELAJARAN
-- ----------------------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text not null,
  name text not null,
  kkm numeric not null default 75,
  teacher_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_subjects_school_code on public.subjects(school_id, lower(code));
create index if not exists idx_subjects_school_active on public.subjects(school_id, is_active);

-- ----------------------------------------------------------------------------
-- 4. PENUGASAN GURU (TEACHER SUBJECT ASSIGNMENTS)
-- ----------------------------------------------------------------------------
create table if not exists public.teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(teacher_id, subject_id, class_id, academic_year_id)
);

create index if not exists idx_teacher_subjects_teacher on public.teacher_subjects(teacher_id);
create index if not exists idx_teacher_subjects_subject on public.teacher_subjects(subject_id);
create index if not exists idx_teacher_subjects_class on public.teacher_subjects(class_id);

-- ----------------------------------------------------------------------------
-- 5. KEANGGOTAAN SISWA DI KELAS (CLASS MEMBERS - SINGLE CANONICAL TABLE)
-- ----------------------------------------------------------------------------
create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_class_members_student on public.class_members(student_id);
create index if not exists idx_class_members_class on public.class_members(class_id);

-- Menjamin 1 siswa hanya memiliki maksimal 1 kelas aktif pada satu waktu
create unique index if not exists uq_class_members_student_active
on public.class_members(student_id)
where left_at is null;
