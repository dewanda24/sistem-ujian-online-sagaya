create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.super_admin_import_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('schools', 'school_admins')),
  status text not null default 'previewed' check (status in ('previewed', 'committed', 'failed')),
  filename text,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  preview_rows jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  committed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create table if not exists public.super_admin_backup_jobs (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('global', 'school')),
  school_id uuid references public.schools(id) on delete set null,
  status text not null default 'completed' check (status in ('running', 'completed', 'failed', 'restored')),
  kind text not null default 'manual',
  snapshot jsonb not null default '{}'::jsonb,
  row_counts jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references public.users(id) on delete set null,
  restored_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  restored_at timestamptz
);

insert into public.system_settings (key, value, description)
values
  (
    'platform',
    jsonb_build_object(
      'app_name', 'Sistem Ujian Online Sagaya',
      'logo_url', '',
      'theme', 'default',
      'maintenance_mode', false
    ),
    'Identitas dan mode platform global.'
  ),
  (
    'cbt_defaults',
    jsonb_build_object(
      'autosave_interval_seconds', 30,
      'default_token_required', true,
      'shuffle_questions', true,
      'shuffle_options', true,
      'fullscreen_violation_limit', 3
    ),
    'Konfigurasi CBT default lintas sekolah.'
  )
on conflict (key) do nothing;

create index if not exists idx_super_admin_import_jobs_type_created
  on public.super_admin_import_jobs(type, created_at desc);

create index if not exists idx_super_admin_backup_jobs_scope_created
  on public.super_admin_backup_jobs(scope, created_at desc);

create index if not exists idx_super_admin_backup_jobs_school
  on public.super_admin_backup_jobs(school_id, created_at desc);
