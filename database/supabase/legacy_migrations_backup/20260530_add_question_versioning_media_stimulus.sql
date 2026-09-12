-- Bank Soal hardening: question versioning, shared stimulus, and media metadata.
-- Additive only. No existing table/column is renamed or dropped.

create table if not exists public.question_stimuli (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null references public.schools(id),
  subject_id uuid references public.subjects(id),
  title text not null,
  content text,
  media_url text,
  media_type text check (
    media_type is null or media_type in ('image', 'audio', 'video', 'file', 'link')
  ),

  is_active boolean not null default true,
  created_by uuid references public.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_question_stimuli_school_id
on public.question_stimuli(school_id);

create index if not exists idx_question_stimuli_subject_id
on public.question_stimuli(subject_id);

create index if not exists idx_question_stimuli_is_active
on public.question_stimuli(is_active);

alter table public.questions
add column if not exists stimulus_id uuid references public.question_stimuli(id);

create index if not exists idx_questions_stimulus_id
on public.questions(stimulus_id);

create table if not exists public.question_attachments (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null references public.questions(id) on delete cascade,
  media_type text not null check (
    media_type in ('image', 'audio', 'video', 'file', 'link')
  ),
  url text not null,
  file_name text,
  caption text,
  order_number integer not null default 1,

  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_attachments_question_id
on public.question_attachments(question_id);

create index if not exists idx_question_attachments_media_type
on public.question_attachments(media_type);

create table if not exists public.question_versions (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null references public.questions(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_reason text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_question_versions_question_id
on public.question_versions(question_id);

create unique index if not exists uq_question_versions_question_version
on public.question_versions(question_id, version_number);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_question_stimuli_updated_at on public.question_stimuli;
create trigger set_question_stimuli_updated_at
before update on public.question_stimuli
for each row
execute function public.set_updated_at();

drop trigger if exists set_question_attachments_updated_at on public.question_attachments;
create trigger set_question_attachments_updated_at
before update on public.question_attachments
for each row
execute function public.set_updated_at();
