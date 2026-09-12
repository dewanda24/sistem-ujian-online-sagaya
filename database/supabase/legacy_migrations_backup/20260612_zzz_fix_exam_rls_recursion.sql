-- Break recursive RLS dependencies between exam_schedules, exam_participants,
-- exam_attempts, exam_answers, and exam_events.

begin;

create or replace function public.current_app_can_read_exam_schedule(target_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_schedules es
    where es.id = target_schedule_id
      and (
        public.current_app_can_monitor_exams(es.school_id)
        or exists (
          select 1
          from public.exam_participants ep
          where ep.exam_schedule_id = es.id
            and ep.student_id = public.current_app_user_id()
        )
      )
  )
$$;

create or replace function public.current_app_can_manage_exam_schedule(target_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_schedules es
    where es.id = target_schedule_id
      and public.current_app_can_manage_exams(es.school_id)
  )
$$;

create or replace function public.current_app_can_monitor_exam_schedule(target_schedule_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_schedules es
    where es.id = target_schedule_id
      and public.current_app_can_monitor_exams(es.school_id)
  )
$$;

create or replace function public.current_app_can_read_exam_participant(target_participant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_participants ep
    join public.exam_schedules es on es.id = ep.exam_schedule_id
    where ep.id = target_participant_id
      and (
        ep.student_id = public.current_app_user_id()
        or public.current_app_can_monitor_exams(es.school_id)
      )
  )
$$;

create or replace function public.current_app_can_read_exam_attempt(target_attempt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    where ea.id = target_attempt_id
      and (
        ea.student_id = public.current_app_user_id()
        or public.current_app_can_monitor_exams(es.school_id)
      )
  )
$$;

create or replace function public.current_student_can_start_exam_attempt(
  target_participant_id uuid,
  target_schedule_id uuid,
  target_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_participants ep
    join public.exam_schedules es on es.id = ep.exam_schedule_id
    where ep.id = target_participant_id
      and ep.exam_schedule_id = target_schedule_id
      and ep.student_id = target_student_id
      and target_student_id = public.current_app_user_id()
      and es.school_id = public.current_app_school_id()
      and es.status in ('scheduled','active')
  )
$$;

create or replace function public.current_student_can_write_exam_answer(
  target_attempt_id uuid,
  target_question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    join public.exam_package_questions epq
      on epq.exam_package_id = es.exam_package_id
     and epq.question_id = target_question_id
    where ea.id = target_attempt_id
      and ea.student_id = public.current_app_user_id()
      and ea.status = 'in_progress'
  )
$$;

create or replace function public.current_student_can_write_exam_event(
  target_attempt_id uuid,
  target_schedule_id uuid,
  target_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_attempts ea
    join public.exam_participants ep on ep.id = ea.exam_participant_id
    where ea.id = target_attempt_id
      and ea.exam_schedule_id = target_schedule_id
      and ea.student_id = target_student_id
      and ep.exam_schedule_id = target_schedule_id
      and ep.student_id = target_student_id
      and target_student_id = public.current_app_user_id()
  )
$$;

drop policy if exists exam_schedules_select_scoped_v2 on public.exam_schedules;
create policy exam_schedules_select_scoped_v2 on public.exam_schedules
for select using (public.current_app_can_read_exam_schedule(id));

drop policy if exists exam_schedule_classes_select_scoped_v2 on public.exam_schedule_classes;
create policy exam_schedule_classes_select_scoped_v2 on public.exam_schedule_classes
for select using (public.current_app_can_read_exam_schedule(exam_schedule_id));

drop policy if exists exam_participants_select_scoped_v2 on public.exam_participants;
create policy exam_participants_select_scoped_v2 on public.exam_participants
for select using (public.current_app_can_read_exam_participant(id));

drop policy if exists exam_participants_insert_manager_v2 on public.exam_participants;
create policy exam_participants_insert_manager_v2 on public.exam_participants
for insert with check (public.current_app_can_manage_exam_schedule(exam_schedule_id));

drop policy if exists exam_participants_update_scoped_v2 on public.exam_participants;
create policy exam_participants_update_scoped_v2 on public.exam_participants
for update using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
)
with check (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_participants_delete_manager_v2 on public.exam_participants;
create policy exam_participants_delete_manager_v2 on public.exam_participants
for delete using (public.current_app_can_manage_exam_schedule(exam_schedule_id));

drop policy if exists exam_attempts_select_scoped_v2 on public.exam_attempts;
create policy exam_attempts_select_scoped_v2 on public.exam_attempts
for select using (public.current_app_can_read_exam_attempt(id));

drop policy if exists exam_attempts_insert_student_or_manager_v2 on public.exam_attempts;
create policy exam_attempts_insert_student_or_manager_v2 on public.exam_attempts
for insert with check (
  public.current_student_can_start_exam_attempt(
    exam_participant_id,
    exam_schedule_id,
    student_id
  )
  or public.current_app_can_manage_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_attempts_update_student_or_monitor_v2 on public.exam_attempts;
create policy exam_attempts_update_student_or_monitor_v2 on public.exam_attempts
for update using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
)
with check (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_attempts_delete_manager_v2 on public.exam_attempts;
create policy exam_attempts_delete_manager_v2 on public.exam_attempts
for delete using (public.current_app_can_manage_exam_schedule(exam_schedule_id));

drop policy if exists exam_answers_select_scoped_v2 on public.exam_answers;
create policy exam_answers_select_scoped_v2 on public.exam_answers
for select using (public.current_app_can_read_exam_attempt(exam_attempt_id));

drop policy if exists exam_answers_insert_student_v2 on public.exam_answers;
create policy exam_answers_insert_student_v2 on public.exam_answers
for insert with check (
  public.current_student_can_write_exam_answer(exam_attempt_id, question_id)
);

drop policy if exists exam_answers_update_student_or_manager_v2 on public.exam_answers;
create policy exam_answers_update_student_or_manager_v2 on public.exam_answers
for update using (
  public.current_student_can_write_exam_answer(exam_attempt_id, question_id)
  or exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and public.current_app_can_manage_exam_schedule(ea.exam_schedule_id)
  )
)
with check (
  public.current_student_can_write_exam_answer(exam_attempt_id, question_id)
  or exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and public.current_app_can_manage_exam_schedule(ea.exam_schedule_id)
  )
);

drop policy if exists exam_answers_delete_manager_v2 on public.exam_answers;
create policy exam_answers_delete_manager_v2 on public.exam_answers
for delete using (
  exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and public.current_app_can_manage_exam_schedule(ea.exam_schedule_id)
  )
);

drop policy if exists exam_events_select_scoped_v2 on public.exam_events;
create policy exam_events_select_scoped_v2 on public.exam_events
for select using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_events_insert_student_or_monitor_v2 on public.exam_events;
create policy exam_events_insert_student_or_monitor_v2 on public.exam_events
for insert with check (
  public.current_student_can_write_exam_event(
    exam_attempt_id,
    exam_schedule_id,
    student_id
  )
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

revoke execute on function public.current_app_can_read_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_manage_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_monitor_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_read_exam_participant(uuid) from public, anon;
revoke execute on function public.current_app_can_read_exam_attempt(uuid) from public, anon;
revoke execute on function public.current_student_can_start_exam_attempt(uuid, uuid, uuid) from public, anon;
revoke execute on function public.current_student_can_write_exam_answer(uuid, uuid) from public, anon;
revoke execute on function public.current_student_can_write_exam_event(uuid, uuid, uuid) from public, anon;

grant execute on function public.current_app_can_read_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_manage_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_monitor_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_read_exam_participant(uuid) to authenticated;
grant execute on function public.current_app_can_read_exam_attempt(uuid) to authenticated;
grant execute on function public.current_student_can_start_exam_attempt(uuid, uuid, uuid) to authenticated;
grant execute on function public.current_student_can_write_exam_answer(uuid, uuid) to authenticated;
grant execute on function public.current_student_can_write_exam_event(uuid, uuid, uuid) to authenticated;

commit;
