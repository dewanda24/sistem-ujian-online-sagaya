-- ============================================================================
-- MIGRATION 03: CBT BANK SOAL (QUESTION BANK)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. KATEGORI & STIMULUS BACAAN
-- ----------------------------------------------------------------------------
create table if not exists public.question_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_categories_school on public.question_categories(school_id);
create index if not exists idx_question_categories_subject on public.question_categories(subject_id);

create table if not exists public.question_stimuli (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  content text not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_stimuli_school on public.question_stimuli(school_id);
create index if not exists idx_question_stimuli_subject on public.question_stimuli(subject_id);

-- ----------------------------------------------------------------------------
-- 2. BUTIR SOAL
-- ----------------------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  category_id uuid references public.question_categories(id) on delete set null,
  stimulus_id uuid references public.question_stimuli(id) on delete set null,
  type text not null default 'single_choice' check (type in ('single_choice', 'multiple_choice', 'true_false', 'essay', 'matching')),
  content text not null,
  explanation text,
  points numeric not null default 1,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_questions_school on public.questions(school_id);
create index if not exists idx_questions_subject on public.questions(subject_id);
create index if not exists idx_questions_status on public.questions(status);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_questions_stimulus on public.questions(stimulus_id);

-- ----------------------------------------------------------------------------
-- 3. OPSI JAWABAN (QUESTION OPTIONS)
-- ----------------------------------------------------------------------------
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null,
  content text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_options_question on public.question_options(question_id);

-- ----------------------------------------------------------------------------
-- 4. LAMPIRAN MEDIA & VERSIONING
-- ----------------------------------------------------------------------------
create table if not exists public.question_attachments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  file_url text not null,
  file_type text not null default 'image',
  created_at timestamptz not null default now()
);

create index if not exists idx_question_attachments_question on public.question_attachments(question_id);

create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  version_number integer not null default 1,
  snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_question_versions_question on public.question_versions(question_id);

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
