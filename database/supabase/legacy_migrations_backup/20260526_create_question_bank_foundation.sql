-- Sprint Bank Soal Foundation
-- Point 1-3: categories, questions, options + permissions

-- =========================
-- 1. QUESTION CATEGORIES
-- =========================
create table if not exists public.question_categories (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null references public.schools(id),
  subject_id uuid not null references public.subjects(id),
  name text not null,
  description text,

  is_active boolean not null default true,
  created_by uuid references public.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_question_categories_school_id
on public.question_categories(school_id);

create index if not exists idx_question_categories_subject_id
on public.question_categories(subject_id);

create index if not exists idx_question_categories_is_active
on public.question_categories(is_active);


-- =========================
-- 2. QUESTIONS
-- =========================
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),

  school_id uuid not null references public.schools(id),
  subject_id uuid not null references public.subjects(id),
  category_id uuid references public.question_categories(id),
  created_by uuid references public.users(id),

  type text not null check (
    type in ('multiple_choice', 'essay')
  ),

  difficulty text not null default 'medium' check (
    difficulty in ('easy', 'medium', 'hard')
  ),

  content text not null,
  explanation text,
  point numeric not null default 1,

  status text not null default 'draft' check (
    status in ('draft', 'published', 'archived')
  ),

  current_version integer not null default 1,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_questions_school_id
on public.questions(school_id);

create index if not exists idx_questions_subject_id
on public.questions(subject_id);

create index if not exists idx_questions_category_id
on public.questions(category_id);

create index if not exists idx_questions_type
on public.questions(type);

create index if not exists idx_questions_difficulty
on public.questions(difficulty);

create index if not exists idx_questions_status
on public.questions(status);

create index if not exists idx_questions_is_active
on public.questions(is_active);


-- =========================
-- 3. QUESTION OPTIONS
-- =========================
create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),

  question_id uuid not null references public.questions(id) on delete cascade,

  option_label text not null,
  option_text text not null,
  is_correct boolean not null default false,
  order_number integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_question_options_question_id
on public.question_options(question_id);

create unique index if not exists uq_question_options_question_label
on public.question_options(question_id, option_label);


-- =========================
-- UPDATED_AT TRIGGER
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_question_categories_updated_at on public.question_categories;
create trigger set_question_categories_updated_at
before update on public.question_categories
for each row
execute function public.set_updated_at();

drop trigger if exists set_questions_updated_at on public.questions;
create trigger set_questions_updated_at
before update on public.questions
for each row
execute function public.set_updated_at();

drop trigger if exists set_question_options_updated_at on public.question_options;
create trigger set_question_options_updated_at
before update on public.question_options
for each row
execute function public.set_updated_at();


-- =========================
-- PERMISSIONS
-- =========================
insert into public.permissions (code, module, action)
values
  ('question_bank.view', 'question_bank', 'view'),
  ('question_bank.manage', 'question_bank', 'manage'),
  ('questions.create', 'questions', 'create'),
  ('questions.update', 'questions', 'update'),
  ('questions.publish', 'questions', 'publish'),
  ('questions.archive', 'questions', 'archive'),
  ('question_categories.manage', 'question_categories', 'manage')
on conflict (code) do nothing;


-- =========================
-- ASSIGN TO SUPER ADMIN + ADMIN
-- =========================
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin')
and p.code in (
  'question_bank.view',
  'question_bank.manage',
  'questions.create',
  'questions.update',
  'questions.publish',
  'questions.archive',
  'question_categories.manage'
)
on conflict do nothing;


-- =========================
-- ASSIGN TO TEACHER
-- =========================
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'teacher'
and p.code in (
  'question_bank.view',
  'questions.create',
  'questions.update',
  'question_categories.manage'
)
on conflict do nothing;