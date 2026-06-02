-- =====================================================
-- USER SCHOOL SCOPE FOUNDATION
-- =====================================================

alter table public.users
add column if not exists school_id uuid
  references public.schools(id)
  on delete set null;

create index if not exists idx_users_school_id
  on public.users(school_id);
