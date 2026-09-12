-- Lightweight active device/session guard for in-progress attempts.

alter table public.exam_attempts
add column if not exists active_session_id text;

alter table public.exam_attempts
add column if not exists active_session_seen_at timestamptz;

create index if not exists idx_exam_attempts_active_session_seen_at
on public.exam_attempts(active_session_seen_at)
where active_session_seen_at is not null;
