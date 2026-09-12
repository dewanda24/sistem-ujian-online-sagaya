-- Allow student-owned exam_attempt INSERT ... RETURNING without weakening
-- cross-student or cross-school visibility. PostgREST applies SELECT RLS to
-- returned rows, so avoid a same-table helper lookup in the SELECT policy.

begin;

drop policy if exists exam_attempts_select_scoped_v2 on public.exam_attempts;

create policy exam_attempts_select_scoped_v2 on public.exam_attempts
for select using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

commit;
