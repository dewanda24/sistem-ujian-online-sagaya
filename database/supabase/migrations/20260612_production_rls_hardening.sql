-- Production RLS hardening for multi-school CBT isolation.

begin;

-- =====================================================
-- REQUIRED RLS HELPERS
-- Keep this migration self-contained for environments
-- that have multi-school helpers but not the draft role
-- hardening helpers yet.
-- =====================================================

create or replace function public.current_app_role_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.role_id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_has_role(role_names text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role_name() = any(role_names), false)
$$;

create or replace function public.current_app_can_read_school(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_is_super_admin()
    or (
      target_school_id is not null
      and target_school_id = public.current_app_school_id()
    )
$$;

create or replace function public.current_app_can_admin_school(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_is_super_admin()
    or (
      public.current_app_role_name() = 'admin'
      and target_school_id is not null
      and target_school_id = public.current_app_school_id()
    )
$$;

create or replace function public.current_app_can_manage_questions(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_is_super_admin()
    or (
      public.current_app_has_role(array['admin','teacher'])
      and target_school_id is not null
      and target_school_id = public.current_app_school_id()
    )
$$;

create or replace function public.current_app_can_manage_exams(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_is_super_admin()
    or (
      public.current_app_has_role(array['admin','teacher'])
      and target_school_id is not null
      and target_school_id = public.current_app_school_id()
    )
$$;

create or replace function public.current_app_can_monitor_exams(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_app_is_super_admin()
    or (
      public.current_app_has_role(array['admin','teacher','proctor','principal'])
      and target_school_id is not null
      and target_school_id = public.current_app_school_id()
    )
$$;

create or replace function public.current_student_has_exam_package(target_package_id uuid)
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
    where ea.student_id = public.current_app_user_id()
      and es.exam_package_id = target_package_id
      and ea.status = 'in_progress'
  )
$$;

create or replace function public.current_student_has_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exam_package_questions epq
    join public.exam_schedules es on es.exam_package_id = epq.exam_package_id
    join public.exam_attempts ea on ea.exam_schedule_id = es.id
    where epq.question_id = target_question_id
      and ea.student_id = public.current_app_user_id()
      and ea.status = 'in_progress'
  )
$$;

create or replace function public.current_app_can_read_question(target_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.questions q
    where q.id = target_question_id
      and (
        public.current_app_can_manage_questions(q.school_id)
        or public.current_student_has_question(q.id)
      )
  )
$$;

-- =====================================================
-- RLS FOR TABLES ADDED AFTER THE ROLE HARDENING DRAFT
-- =====================================================

alter table public.exam_proctors enable row level security;
alter table public.system_settings enable row level security;
alter table public.super_admin_import_jobs enable row level security;
alter table public.super_admin_backup_jobs enable row level security;

drop policy if exists exam_proctors_select_hardened on public.exam_proctors;
drop policy if exists exam_proctors_insert_hardened on public.exam_proctors;
drop policy if exists exam_proctors_update_hardened on public.exam_proctors;
drop policy if exists exam_proctors_delete_hardened on public.exam_proctors;

create policy exam_proctors_select_hardened on public.exam_proctors
for select using (
  public.current_app_can_manage_exams(school_id)
  or (
    teacher_id = public.current_app_user_id()
    and public.current_app_can_read_school(school_id)
  )
);

create policy exam_proctors_insert_hardened on public.exam_proctors
for insert with check (public.current_app_can_manage_exams(school_id));

create policy exam_proctors_update_hardened on public.exam_proctors
for update using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

create policy exam_proctors_delete_hardened on public.exam_proctors
for delete using (public.current_app_can_manage_exams(school_id));

drop policy if exists system_settings_select_super_admin_hardened on public.system_settings;
drop policy if exists system_settings_insert_super_admin_hardened on public.system_settings;
drop policy if exists system_settings_update_super_admin_hardened on public.system_settings;
drop policy if exists system_settings_delete_super_admin_hardened on public.system_settings;

create policy system_settings_select_super_admin_hardened on public.system_settings
for select using (public.current_app_is_super_admin());

create policy system_settings_insert_super_admin_hardened on public.system_settings
for insert with check (public.current_app_is_super_admin());

create policy system_settings_update_super_admin_hardened on public.system_settings
for update using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

create policy system_settings_delete_super_admin_hardened on public.system_settings
for delete using (public.current_app_is_super_admin());

drop policy if exists super_admin_import_jobs_select_super_admin_hardened on public.super_admin_import_jobs;
drop policy if exists super_admin_import_jobs_insert_super_admin_hardened on public.super_admin_import_jobs;
drop policy if exists super_admin_import_jobs_update_super_admin_hardened on public.super_admin_import_jobs;
drop policy if exists super_admin_import_jobs_delete_super_admin_hardened on public.super_admin_import_jobs;

create policy super_admin_import_jobs_select_super_admin_hardened on public.super_admin_import_jobs
for select using (public.current_app_is_super_admin());

create policy super_admin_import_jobs_insert_super_admin_hardened on public.super_admin_import_jobs
for insert with check (public.current_app_is_super_admin());

create policy super_admin_import_jobs_update_super_admin_hardened on public.super_admin_import_jobs
for update using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

create policy super_admin_import_jobs_delete_super_admin_hardened on public.super_admin_import_jobs
for delete using (public.current_app_is_super_admin());

drop policy if exists super_admin_backup_jobs_select_super_admin_hardened on public.super_admin_backup_jobs;
drop policy if exists super_admin_backup_jobs_insert_super_admin_hardened on public.super_admin_backup_jobs;
drop policy if exists super_admin_backup_jobs_update_super_admin_hardened on public.super_admin_backup_jobs;
drop policy if exists super_admin_backup_jobs_delete_super_admin_hardened on public.super_admin_backup_jobs;

create policy super_admin_backup_jobs_select_super_admin_hardened on public.super_admin_backup_jobs
for select using (public.current_app_is_super_admin());

create policy super_admin_backup_jobs_insert_super_admin_hardened on public.super_admin_backup_jobs
for insert with check (public.current_app_is_super_admin());

create policy super_admin_backup_jobs_update_super_admin_hardened on public.super_admin_backup_jobs
for update using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

create policy super_admin_backup_jobs_delete_super_admin_hardened on public.super_admin_backup_jobs
for delete using (public.current_app_is_super_admin());

-- =====================================================
-- STORAGE HARDENING FOR QUESTION MEDIA
-- Path format: {school_id}/{user_id}/{date}/{uuid}
-- =====================================================

update storage.buckets
set public = false
where id = 'question-media';

drop policy if exists question_media_public_select on storage.objects;
drop policy if exists question_media_authenticated_insert on storage.objects;
drop policy if exists question_media_authenticated_update on storage.objects;
drop policy if exists question_media_authenticated_delete on storage.objects;
drop policy if exists question_media_school_select_hardened on storage.objects;
drop policy if exists question_media_school_insert_hardened on storage.objects;
drop policy if exists question_media_school_update_hardened on storage.objects;
drop policy if exists question_media_school_delete_hardened on storage.objects;

create policy question_media_school_select_hardened on storage.objects
for select to authenticated
using (
  bucket_id = 'question-media'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(name, '/', 1)::uuid = public.current_app_school_id()
    else false
  end
);

create policy question_media_school_insert_hardened on storage.objects
for insert to authenticated
with check (
  bucket_id = 'question-media'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.current_app_can_manage_questions(split_part(name, '/', 1)::uuid)
    else false
  end
);

create policy question_media_school_update_hardened on storage.objects
for update to authenticated
using (
  bucket_id = 'question-media'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.current_app_can_manage_questions(split_part(name, '/', 1)::uuid)
    else false
  end
)
with check (
  bucket_id = 'question-media'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.current_app_can_manage_questions(split_part(name, '/', 1)::uuid)
    else false
  end
);

create policy question_media_school_delete_hardened on storage.objects
for delete to authenticated
using (
  bucket_id = 'question-media'
  and case
    when split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.current_app_can_manage_questions(split_part(name, '/', 1)::uuid)
    else false
  end
);

-- =====================================================
-- DROP OVERLY BROAD USER SELECT POLICY
-- =====================================================

drop policy if exists users_tenant_select on public.users;

-- =====================================================
-- EXAM CONSISTENCY HELPERS AND TRIGGERS
-- =====================================================

create or replace function public.assert_exam_attempt_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_row record;
  schedule_school_id uuid;
begin
  select p.exam_schedule_id, p.student_id, es.school_id
    into participant_row
  from public.exam_participants p
  join public.exam_schedules es on es.id = p.exam_schedule_id
  where p.id = new.exam_participant_id;

  if participant_row.exam_schedule_id is null then
    raise exception 'exam attempt participant not found';
  end if;

  if participant_row.exam_schedule_id <> new.exam_schedule_id then
    raise exception 'exam attempt schedule must match participant schedule';
  end if;

  if participant_row.student_id <> new.student_id then
    raise exception 'exam attempt student must match participant student';
  end if;

  select school_id into schedule_school_id
  from public.exam_schedules
  where id = new.exam_schedule_id;

  if schedule_school_id is null then
    raise exception 'exam attempt schedule not found';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_attempt_consistency on public.exam_attempts;
create trigger assert_exam_attempt_consistency
before insert or update on public.exam_attempts
for each row execute function public.assert_exam_attempt_consistency();

create or replace function public.assert_exam_answer_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row record;
begin
  select ea.exam_schedule_id, ea.student_id, es.exam_package_id
    into attempt_row
  from public.exam_attempts ea
  join public.exam_schedules es on es.id = ea.exam_schedule_id
  where ea.id = new.exam_attempt_id;

  if attempt_row.exam_schedule_id is null then
    raise exception 'exam answer attempt not found';
  end if;

  if not exists (
    select 1
    from public.exam_package_questions epq
    where epq.exam_package_id = attempt_row.exam_package_id
      and epq.question_id = new.question_id
  ) then
    raise exception 'exam answer question must belong to attempt exam package';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_answer_consistency on public.exam_answers;
create trigger assert_exam_answer_consistency
before insert or update on public.exam_answers
for each row execute function public.assert_exam_answer_consistency();

create or replace function public.assert_exam_event_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row record;
begin
  select ea.exam_schedule_id, ea.student_id, ea.exam_participant_id
    into attempt_row
  from public.exam_attempts ea
  where ea.id = new.exam_attempt_id;

  if attempt_row.exam_schedule_id is null then
    raise exception 'exam event attempt not found';
  end if;

  if attempt_row.exam_schedule_id <> new.exam_schedule_id then
    raise exception 'exam event schedule must match attempt schedule';
  end if;

  if attempt_row.student_id <> new.student_id then
    raise exception 'exam event student must match attempt student';
  end if;

  if not exists (
    select 1
    from public.exam_participants p
    where p.id = attempt_row.exam_participant_id
      and p.exam_schedule_id = new.exam_schedule_id
      and p.student_id = new.student_id
  ) then
    raise exception 'exam event participant must match attempt schedule and student';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_event_consistency on public.exam_events;
create trigger assert_exam_event_consistency
before insert or update on public.exam_events
for each row execute function public.assert_exam_event_consistency();

create or replace function public.assert_exam_participant_update_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_school_id uuid;
  new_school_id uuid;
begin
  select school_id into old_school_id
  from public.exam_schedules
  where id = old.exam_schedule_id;

  select school_id into new_school_id
  from public.exam_schedules
  where id = new.exam_schedule_id;

  if old_school_id is null or new_school_id is null then
    raise exception 'exam participant schedule not found';
  end if;

  if public.current_app_can_manage_exams(old_school_id)
    and public.current_app_can_manage_exams(new_school_id) then
    return new;
  end if;

  if old.student_id <> public.current_app_user_id()
    or new.student_id <> public.current_app_user_id() then
    raise exception 'student can only update their own participant row';
  end if;

  if old.exam_schedule_id <> new.exam_schedule_id
    or old.student_id <> new.student_id
    or old.class_id is distinct from new.class_id then
    raise exception 'student cannot change participant identity fields';
  end if;

  if old_school_id <> public.current_app_school_id()
    or new_school_id <> public.current_app_school_id() then
    raise exception 'student cannot update participant outside school scope';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_participant_update_scope on public.exam_participants;
create trigger assert_exam_participant_update_scope
before update on public.exam_participants
for each row execute function public.assert_exam_participant_update_scope();

-- =====================================================
-- EXAM RLS HARDENING
-- =====================================================

drop policy if exists exam_participants_update_scoped_v2 on public.exam_participants;
create policy exam_participants_update_scoped_v2 on public.exam_participants
for update using (
  (
    exam_participants.student_id = public.current_app_user_id()
    and exists (
      select 1
      from public.exam_schedules es
      where es.id = exam_participants.exam_schedule_id
        and public.current_app_can_read_school(es.school_id)
    )
  )
  or exists (
    select 1
    from public.exam_schedules es
    where es.id = exam_participants.exam_schedule_id
      and public.current_app_has_role(array['super_admin','admin','teacher','proctor'])
      and public.current_app_can_read_school(es.school_id)
  )
)
with check (
  (
    exam_participants.student_id = public.current_app_user_id()
    and exists (
      select 1
      from public.exam_schedules es
      where es.id = exam_participants.exam_schedule_id
        and public.current_app_can_read_school(es.school_id)
    )
  )
  or exists (
    select 1
    from public.exam_schedules es
    where es.id = exam_participants.exam_schedule_id
      and public.current_app_has_role(array['super_admin','admin','teacher','proctor'])
      and public.current_app_can_read_school(es.school_id)
  )
);

drop policy if exists exam_attempts_insert_student_or_manager_v2 on public.exam_attempts;
create policy exam_attempts_insert_student_or_manager_v2 on public.exam_attempts
for insert with check (
  (
    exam_attempts.student_id = public.current_app_user_id()
    and exists (
      select 1
      from public.exam_participants p
      join public.exam_schedules es on es.id = p.exam_schedule_id
      where p.id = exam_attempts.exam_participant_id
        and p.exam_schedule_id = exam_attempts.exam_schedule_id
        and p.student_id = exam_attempts.student_id
        and public.current_app_can_read_school(es.school_id)
        and es.deleted_at is null
        and es.is_active
        and es.status in ('scheduled','active')
    )
  )
  or exists (
    select 1
    from public.exam_participants p
    join public.exam_schedules es on es.id = p.exam_schedule_id
    where p.id = exam_attempts.exam_participant_id
      and p.exam_schedule_id = exam_attempts.exam_schedule_id
      and p.student_id = exam_attempts.student_id
      and public.current_app_can_manage_exams(es.school_id)
  )
);

drop policy if exists exam_attempts_update_student_or_monitor_v2 on public.exam_attempts;
create policy exam_attempts_update_student_or_monitor_v2 on public.exam_attempts
for update using (
  (
    exam_attempts.student_id = public.current_app_user_id()
    and exists (
      select 1
      from public.exam_participants p
      join public.exam_schedules es on es.id = p.exam_schedule_id
      where p.id = exam_attempts.exam_participant_id
        and p.exam_schedule_id = exam_attempts.exam_schedule_id
        and p.student_id = exam_attempts.student_id
        and public.current_app_can_read_school(es.school_id)
    )
  )
  or exists (
    select 1
    from public.exam_schedules es
    where es.id = exam_attempts.exam_schedule_id
      and public.current_app_has_role(array['super_admin','admin','teacher','proctor'])
      and public.current_app_can_read_school(es.school_id)
  )
)
with check (
  (
    exam_attempts.student_id = public.current_app_user_id()
    and exists (
      select 1
      from public.exam_participants p
      join public.exam_schedules es on es.id = p.exam_schedule_id
      where p.id = exam_attempts.exam_participant_id
        and p.exam_schedule_id = exam_attempts.exam_schedule_id
        and p.student_id = exam_attempts.student_id
        and public.current_app_can_read_school(es.school_id)
    )
  )
  or exists (
    select 1
    from public.exam_schedules es
    where es.id = exam_attempts.exam_schedule_id
      and public.current_app_has_role(array['super_admin','admin','teacher','proctor'])
      and public.current_app_can_read_school(es.school_id)
  )
);

drop policy if exists exam_answers_insert_student_v2 on public.exam_answers;
create policy exam_answers_insert_student_v2 on public.exam_answers
for insert with check (
  exists (
    select 1
    from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    join public.exam_package_questions epq on epq.exam_package_id = es.exam_package_id
    where ea.id = exam_answers.exam_attempt_id
      and ea.student_id = public.current_app_user_id()
      and ea.status = 'in_progress'
      and epq.question_id = exam_answers.question_id
  )
);

drop policy if exists exam_answers_update_student_or_manager_v2 on public.exam_answers;
create policy exam_answers_update_student_or_manager_v2 on public.exam_answers
for update using (
  exists (
    select 1
    from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    join public.exam_package_questions epq on epq.exam_package_id = es.exam_package_id
    where ea.id = exam_answers.exam_attempt_id
      and epq.question_id = exam_answers.question_id
      and (
        (ea.student_id = public.current_app_user_id() and ea.status = 'in_progress')
        or (
          public.current_app_has_role(array['super_admin','admin','teacher'])
          and public.current_app_can_read_school(es.school_id)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    join public.exam_package_questions epq on epq.exam_package_id = es.exam_package_id
    where ea.id = exam_answers.exam_attempt_id
      and epq.question_id = exam_answers.question_id
      and (
        (ea.student_id = public.current_app_user_id() and ea.status = 'in_progress')
        or (
          public.current_app_has_role(array['super_admin','admin','teacher'])
          and public.current_app_can_read_school(es.school_id)
        )
      )
  )
);

drop policy if exists exam_events_insert_student_or_monitor_v2 on public.exam_events;
create policy exam_events_insert_student_or_monitor_v2 on public.exam_events
for insert with check (
  exists (
    select 1
    from public.exam_attempts ea
    join public.exam_participants p on p.id = ea.exam_participant_id
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    where ea.id = exam_events.exam_attempt_id
      and ea.exam_schedule_id = exam_events.exam_schedule_id
      and ea.student_id = exam_events.student_id
      and p.exam_schedule_id = exam_events.exam_schedule_id
      and p.student_id = exam_events.student_id
      and (
        exam_events.student_id = public.current_app_user_id()
        or (
          public.current_app_has_role(array['super_admin','admin','teacher','proctor'])
          and public.current_app_can_read_school(es.school_id)
        )
      )
  )
);

-- =====================================================
-- AUDIT LOG INSERT HARDENING
-- =====================================================

drop policy if exists audit_logs_insert_authenticated_v2 on public.audit_logs;
create policy audit_logs_insert_authenticated_v2 on public.audit_logs
for insert with check (user_id = public.current_app_user_id());

-- =====================================================
-- HELPER EXECUTE PRIVILEGES
-- =====================================================

revoke execute on function public.current_app_user_id() from public, anon;
revoke execute on function public.current_app_role_name() from public, anon;
revoke execute on function public.current_app_school_id() from public, anon;
revoke execute on function public.current_app_is_super_admin() from public, anon;
revoke execute on function public.can_access_school(uuid) from public, anon;
revoke execute on function public.current_app_role_id() from public, anon;
revoke execute on function public.current_app_has_role(text[]) from public, anon;
revoke execute on function public.current_app_can_read_school(uuid) from public, anon;
revoke execute on function public.current_app_can_admin_school(uuid) from public, anon;
revoke execute on function public.current_app_can_manage_questions(uuid) from public, anon;
revoke execute on function public.current_app_can_manage_exams(uuid) from public, anon;
revoke execute on function public.current_app_can_monitor_exams(uuid) from public, anon;
revoke execute on function public.current_student_has_exam_package(uuid) from public, anon;
revoke execute on function public.current_student_has_question(uuid) from public, anon;
revoke execute on function public.current_app_can_read_question(uuid) from public, anon;

grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_app_role_name() to authenticated;
grant execute on function public.current_app_school_id() to authenticated;
grant execute on function public.current_app_is_super_admin() to authenticated;
grant execute on function public.can_access_school(uuid) to authenticated;
grant execute on function public.current_app_role_id() to authenticated;
grant execute on function public.current_app_has_role(text[]) to authenticated;
grant execute on function public.current_app_can_read_school(uuid) to authenticated;
grant execute on function public.current_app_can_admin_school(uuid) to authenticated;
grant execute on function public.current_app_can_manage_questions(uuid) to authenticated;
grant execute on function public.current_app_can_manage_exams(uuid) to authenticated;
grant execute on function public.current_app_can_monitor_exams(uuid) to authenticated;
grant execute on function public.current_student_has_exam_package(uuid) to authenticated;
grant execute on function public.current_student_has_question(uuid) to authenticated;
grant execute on function public.current_app_can_read_question(uuid) to authenticated;

commit;
