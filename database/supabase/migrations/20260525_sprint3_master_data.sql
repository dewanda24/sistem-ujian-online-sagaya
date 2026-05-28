-- =====================================================
-- SPRINT 3 - MASTER DATA MANAGEMENT
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- SCHOOLS
-- =====================================================

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  npsn text,
  address text,
  city text,
  province text,
  principal_name text,
  email text,
  phone text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =====================================================
-- ACADEMIC YEARS
-- =====================================================

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references public.schools(id)
    on delete cascade,

  name text not null,

  start_date date,
  end_date date,

  is_active boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =====================================================
-- SEMESTERS
-- =====================================================

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete cascade,

  name text not null,
  code text not null,

  is_active boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =====================================================
-- CLASSES
-- =====================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references public.schools(id)
    on delete cascade,

  name text not null,
  grade_level text not null,

  sort_order integer,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =====================================================
-- SUBJECTS
-- =====================================================

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null
    references public.schools(id)
    on delete cascade,

  name text not null,
  code text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- =====================================================
-- TEACHER SUBJECTS
-- =====================================================

create table if not exists public.teacher_subjects (
  id uuid primary key default gen_random_uuid(),

  teacher_id uuid not null
    references public.users(id)
    on delete cascade,

  subject_id uuid not null
    references public.subjects(id)
    on delete cascade,

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete cascade,

  created_at timestamptz not null default now()
);

-- =====================================================
-- STUDENT CLASSES
-- =====================================================

create table if not exists public.student_classes (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.users(id)
    on delete cascade,

  class_id uuid not null
    references public.classes(id)
    on delete cascade,

  academic_year_id uuid not null
    references public.academic_years(id)
    on delete cascade,

  created_at timestamptz not null default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_academic_years_school_id
  on public.academic_years(school_id);

create index if not exists idx_semesters_academic_year_id
  on public.semesters(academic_year_id);

create index if not exists idx_classes_school_id
  on public.classes(school_id);

create index if not exists idx_subjects_school_id
  on public.subjects(school_id);

create index if not exists idx_teacher_subjects_teacher_id
  on public.teacher_subjects(teacher_id);

create index if not exists idx_teacher_subjects_subject_id
  on public.teacher_subjects(subject_id);

create index if not exists idx_teacher_subjects_class_id
  on public.teacher_subjects(class_id);

create index if not exists idx_student_classes_student_id
  on public.student_classes(student_id);

create index if not exists idx_student_classes_class_id
  on public.student_classes(class_id);