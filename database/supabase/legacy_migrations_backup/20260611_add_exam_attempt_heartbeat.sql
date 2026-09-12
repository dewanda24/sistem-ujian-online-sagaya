-- Store the latest student activity timestamp for live monitoring.

alter table public.exam_attempts
add column if not exists last_activity_at timestamptz;

create index if not exists idx_exam_attempts_last_activity_at
on public.exam_attempts(last_activity_at)
where last_activity_at is not null;
