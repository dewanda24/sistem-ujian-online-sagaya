-- Migration 20260101000008: Penyelarasan Skema & Constraints CBT Exam Engine
-- Menyelaraskan status check constraints dan kolom-kolom yang digunakan oleh kode aplikasi CBT

-- ----------------------------------------------------------------------------
-- 1. TABEL EXAM_PARTICIPANTS
-- ----------------------------------------------------------------------------
-- Perbarui batasan status agar mendukung status operasional lengkap:
-- assigned, registered, in_progress, submitted, expired, absent, cancelled, completed, blocked
alter table public.exam_participants
  drop constraint if exists exam_participants_status_check;

alter table public.exam_participants
  add constraint exam_participants_status_check check (
    status in (
      'assigned',
      'registered',
      'in_progress',
      'submitted',
      'expired',
      'absent',
      'cancelled',
      'completed',
      'blocked'
    )
  );

alter table public.exam_participants
  alter column status set default 'assigned';

-- Tambahkan kolom tracking waktu pada peserta
alter table public.exam_participants
  add column if not exists assigned_at timestamptz not null default now();

alter table public.exam_participants
  add column if not exists started_at timestamptz;

alter table public.exam_participants
  add column if not exists submitted_at timestamptz;

create index if not exists idx_exam_participants_assigned_at
  on public.exam_participants(assigned_at desc);

-- ----------------------------------------------------------------------------
-- 2. TABEL EXAM_ATTEMPTS
-- ----------------------------------------------------------------------------
-- Perbarui batasan status exam_attempts agar mendukung 'expired' dan 'cancelled'
alter table public.exam_attempts
  drop constraint if exists exam_attempts_status_check;

alter table public.exam_attempts
  add constraint exam_attempts_status_check check (
    status in (
      'in_progress',
      'submitted',
      'graded',
      'abandoned',
      'locked',
      'expired',
      'cancelled'
    )
  );

-- Perbarui batasan grading_status agar sinkron dengan scoring engine:
-- pending, auto_scored, needs_manual_grading, finalized (+ backward compat: ungraded, partial, graded)
alter table public.exam_attempts
  drop constraint if exists exam_attempts_grading_status_check;

alter table public.exam_attempts
  add constraint exam_attempts_grading_status_check check (
    grading_status in (
      'ungraded',
      'partial',
      'graded',
      'pending',
      'auto_scored',
      'needs_manual_grading',
      'finalized'
    )
  );

-- Tambahkan kolom scoring & breakdown agregat jawaban
alter table public.exam_attempts
  add column if not exists auto_score numeric;

alter table public.exam_attempts
  add column if not exists essay_score numeric;

alter table public.exam_attempts
  add column if not exists total_questions integer not null default 0;

alter table public.exam_attempts
  add column if not exists answered_questions integer not null default 0;

alter table public.exam_attempts
  add column if not exists correct_answers integer not null default 0;

-- ----------------------------------------------------------------------------
-- 3. TABEL EXAM_ANSWERS
-- ----------------------------------------------------------------------------
alter table public.exam_answers
  add column if not exists max_score numeric;

alter table public.exam_answers
  add column if not exists awarded_score numeric;

alter table public.exam_answers
  add column if not exists needs_manual_grading boolean not null default false;

alter table public.exam_answers
  add column if not exists teacher_note text;

alter table public.exam_answers
  add column if not exists graded_by uuid references public.users(id) on delete set null;

alter table public.exam_answers
  add column if not exists graded_at timestamptz;

-- ----------------------------------------------------------------------------
-- 4. TABEL EXAM_EVENTS
-- ----------------------------------------------------------------------------
alter table public.exam_events
  add column if not exists exam_schedule_id uuid references public.exam_schedules(id) on delete cascade;

alter table public.exam_events
  add column if not exists student_id uuid references public.users(id) on delete set null;

create index if not exists idx_exam_events_schedule
  on public.exam_events(exam_schedule_id);

create index if not exists idx_exam_events_student
  on public.exam_events(student_id);

-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKET: QUESTION-MEDIA
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-media',
  'question-media',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists question_media_public_select on storage.objects;
create policy question_media_public_select on storage.objects
for select
using (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_insert on storage.objects;
create policy question_media_authenticated_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_update on storage.objects;
create policy question_media_authenticated_update on storage.objects
for update
to authenticated
using (bucket_id = 'question-media')
with check (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_delete on storage.objects;
create policy question_media_authenticated_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'question-media');
