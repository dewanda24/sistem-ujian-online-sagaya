-- ==============================================================================
-- CANONICAL MIGRATION 05: SYSTEM GOVERNANCE & AUDIT TRAIL
-- Covers: audit_logs, system_settings, super_admin_import_jobs, super_admin_backup_jobs
-- ==============================================================================

-- 1. SYSTEM SETTINGS
-- Stores global platform identity and default CBT configurations.
create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2. AUDIT LOGS
-- Immutable log of security, administrative, and critical domain events.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  payload jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_user_id
  on public.audit_logs(user_id);

create index if not exists idx_audit_logs_action
  on public.audit_logs(action);

create index if not exists idx_audit_logs_entity
  on public.audit_logs(entity_type, entity_id);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs(created_at desc);

-- 3. SUPER ADMIN IMPORT JOBS
-- Tracks asynchronous bulk batch operations (e.g. bulk school / school admin onboarding).
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

create index if not exists idx_super_admin_import_jobs_type_created
  on public.super_admin_import_jobs(type, created_at desc);

-- 4. SUPER ADMIN BACKUP JOBS
-- Tracks snapshot and disaster recovery operations (global or per-school).
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

create index if not exists idx_super_admin_backup_jobs_scope_created
  on public.super_admin_backup_jobs(scope, created_at desc);

create index if not exists idx_super_admin_backup_jobs_school
  on public.super_admin_backup_jobs(school_id, created_at desc);
