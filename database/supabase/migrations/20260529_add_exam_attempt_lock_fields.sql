-- Add lightweight lock state for exam attempts without changing status constraints.
-- A locked attempt stays in_progress but cannot save answers or submit until unlocked.

alter table public.exam_attempts
add column if not exists locked_at timestamptz;

alter table public.exam_attempts
add column if not exists locked_by uuid references public.users(id);

alter table public.exam_attempts
add column if not exists lock_reason text;

create index if not exists idx_exam_attempts_locked_at
on public.exam_attempts(locked_at)
where locked_at is not null;
