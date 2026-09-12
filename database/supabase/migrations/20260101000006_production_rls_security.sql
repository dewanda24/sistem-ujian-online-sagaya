-- ==============================================================================
-- CANONICAL MIGRATION 06: PRODUCTION RLS SECURITY & HARDENING
-- Consolidates all Row Level Security policies, non-recursive helper functions,
-- and domain consistency triggers across all tables.
-- ==============================================================================

-- ==============================================================================
-- 1. SECURITY DEFINER HELPER FUNCTIONS
-- Explicit search_path = public prevents search_path hijacking & recursion.
-- ==============================================================================

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_app_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

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
  limit 1;
$$;

create or replace function public.current_app_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.school_id
  from public.users u
  where u.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_app_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role_name() = 'super_admin', false);
$$;

create or replace function public.current_app_has_role(role_names text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role_name() = any(role_names), false);
$$;

create or replace function public.can_access_school(target_school_id uuid)
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
    );
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
    );
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
    );
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
    );
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
    );
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
    );
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
  );
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
  );
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
  );
$$;

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
  );
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
  );
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
  );
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
  );
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
  );
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
  );
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
  );
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
  );
$$;

-- ==============================================================================
-- 2. CONSISTENCY TRIGGERS
-- ==============================================================================

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

-- ==============================================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ==============================================================================

alter table public.schools enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_profiles enable row level security;

alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.class_members enable row level security;

alter table public.question_categories enable row level security;
alter table public.question_stimuli enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_attachments enable row level security;
alter table public.question_versions enable row level security;

alter table public.exam_packages enable row level security;
alter table public.exam_package_questions enable row level security;
alter table public.exam_schedules enable row level security;
alter table public.exam_schedule_classes enable row level security;
alter table public.exam_proctors enable row level security;
alter table public.exam_participants enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.exam_events enable row level security;

alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;
alter table public.super_admin_import_jobs enable row level security;
alter table public.super_admin_backup_jobs enable row level security;

-- ==============================================================================
-- 4. POLICIES: AUTH & PLATFORM CORE
-- ==============================================================================

-- SCHOOLS
drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools
for select using (public.can_access_school(id));

drop policy if exists schools_super_admin_write on public.schools;
create policy schools_super_admin_write on public.schools
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- ROLES
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
for select using (
  public.current_app_has_role(array['super_admin','admin'])
  or id = public.current_app_role_id()
);

drop policy if exists roles_super_admin_write on public.roles;
create policy roles_super_admin_write on public.roles
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- PERMISSIONS
drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions
for select using (
  public.current_app_has_role(array['super_admin','admin'])
  or exists (
    select 1
    from public.role_permissions rp
    where rp.permission_id = permissions.id
      and rp.role_id = public.current_app_role_id()
  )
);

drop policy if exists permissions_super_admin_write on public.permissions;
create policy permissions_super_admin_write on public.permissions
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- ROLE PERMISSIONS
drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
for select using (
  public.current_app_has_role(array['super_admin','admin'])
  or role_id = public.current_app_role_id()
);

drop policy if exists role_permissions_super_admin_write on public.role_permissions;
create policy role_permissions_super_admin_write on public.role_permissions
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- USERS
drop policy if exists users_select on public.users;
create policy users_select on public.users
for select using (
  public.current_app_is_super_admin()
  or id = public.current_app_user_id()
  or (
    school_id = public.current_app_school_id()
    and public.current_app_has_role(array['admin','teacher','proctor','principal'])
  )
);

drop policy if exists users_insert on public.users;
create policy users_insert on public.users
for insert with check (public.current_app_can_admin_school(school_id));

drop policy if exists users_update on public.users;
create policy users_update on public.users
for update using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

drop policy if exists users_delete on public.users;
create policy users_delete on public.users
for delete using (public.current_app_can_admin_school(school_id));

-- USER PROFILES
drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select on public.user_profiles
for select using (
  user_id = public.current_app_user_id()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and (
        public.current_app_can_admin_school(u.school_id)
        or (
          public.current_app_has_role(array['teacher','proctor','principal'])
          and u.school_id = public.current_app_school_id()
        )
      )
  )
);

drop policy if exists user_profiles_insert on public.user_profiles;
create policy user_profiles_insert on public.user_profiles
for insert with check (
  user_id = public.current_app_user_id()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and public.current_app_can_admin_school(u.school_id)
  )
);

drop policy if exists user_profiles_update on public.user_profiles;
create policy user_profiles_update on public.user_profiles
for update using (
  user_id = public.current_app_user_id()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and public.current_app_can_admin_school(u.school_id)
  )
)
with check (
  user_id = public.current_app_user_id()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and public.current_app_can_admin_school(u.school_id)
  )
);

drop policy if exists user_profiles_delete on public.user_profiles;
create policy user_profiles_delete on public.user_profiles
for delete using (
  exists (
    select 1
    from public.users u
    where u.id = user_id
      and public.current_app_can_admin_school(u.school_id)
  )
);

-- ==============================================================================
-- 5. POLICIES: ACADEMIC MASTER DATA
-- ==============================================================================

-- ACADEMIC YEARS
drop policy if exists academic_years_select on public.academic_years;
create policy academic_years_select on public.academic_years
for select using (public.current_app_can_read_school(school_id));

drop policy if exists academic_years_write on public.academic_years;
create policy academic_years_write on public.academic_years
for all using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

-- SEMESTERS
drop policy if exists semesters_select on public.semesters;
create policy semesters_select on public.semesters
for select using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.academic_years ay
    where ay.id = academic_year_id
      and ay.school_id = public.current_app_school_id()
  )
);

drop policy if exists semesters_write on public.semesters;
create policy semesters_write on public.semesters
for all using (
  exists (
    select 1 from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
)
with check (
  exists (
    select 1 from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
);

-- CLASSES
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
for select using (public.current_app_can_read_school(school_id));

drop policy if exists classes_write on public.classes;
create policy classes_write on public.classes
for all using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

-- SUBJECTS
drop policy if exists subjects_select on public.subjects;
create policy subjects_select on public.subjects
for select using (public.current_app_can_read_school(school_id));

drop policy if exists subjects_write on public.subjects;
create policy subjects_write on public.subjects
for all using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

-- TEACHER SUBJECTS
drop policy if exists teacher_subjects_select on public.teacher_subjects;
create policy teacher_subjects_select on public.teacher_subjects
for select using (
  public.current_app_is_super_admin()
  or teacher_id = public.current_app_user_id()
  or exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and s.school_id = public.current_app_school_id()
      and public.current_app_has_role(array['admin','principal'])
  )
);

drop policy if exists teacher_subjects_write on public.teacher_subjects;
create policy teacher_subjects_write on public.teacher_subjects
for all using (
  exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and public.current_app_can_admin_school(s.school_id)
  )
)
with check (
  exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and public.current_app_can_admin_school(s.school_id)
  )
);

-- CLASS MEMBERS
drop policy if exists class_members_select on public.class_members;
create policy class_members_select on public.class_members
for select using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
      and (
        public.current_app_has_role(array['admin','principal','proctor'])
        or c.homeroom_teacher_id = public.current_app_user_id()
      )
  )
);

drop policy if exists class_members_write on public.class_members;
create policy class_members_write on public.class_members
for all using (
  exists (
    select 1 from public.classes c
    where c.id = class_id
      and public.current_app_can_admin_school(c.school_id)
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id = class_id
      and public.current_app_can_admin_school(c.school_id)
  )
);

-- ==============================================================================
-- 6. POLICIES: CBT QUESTION BANK
-- ==============================================================================

-- QUESTION CATEGORIES
drop policy if exists question_categories_select on public.question_categories;
create policy question_categories_select on public.question_categories
for select using (public.current_app_can_read_school(school_id));

drop policy if exists question_categories_write on public.question_categories;
create policy question_categories_write on public.question_categories
for all using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

-- QUESTION STIMULI
drop policy if exists question_stimuli_select on public.question_stimuli;
create policy question_stimuli_select on public.question_stimuli
for select using (public.current_app_can_read_school(school_id));

drop policy if exists question_stimuli_write on public.question_stimuli;
create policy question_stimuli_write on public.question_stimuli
for all using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

-- QUESTIONS
drop policy if exists questions_select on public.questions;
create policy questions_select on public.questions
for select using (public.current_app_can_read_question(id));

drop policy if exists questions_write on public.questions;
create policy questions_write on public.questions
for all using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

-- QUESTION OPTIONS
drop policy if exists question_options_select on public.question_options;
create policy question_options_select on public.question_options
for select using (public.current_app_can_read_question(question_id));

drop policy if exists question_options_write on public.question_options;
create policy question_options_write on public.question_options
for all using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
)
with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

-- QUESTION ATTACHMENTS
drop policy if exists question_attachments_select on public.question_attachments;
create policy question_attachments_select on public.question_attachments
for select using (public.current_app_can_read_question(question_id));

drop policy if exists question_attachments_write on public.question_attachments;
create policy question_attachments_write on public.question_attachments
for all using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
)
with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

-- QUESTION VERSIONS
drop policy if exists question_versions_select on public.question_versions;
create policy question_versions_select on public.question_versions
for select using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

drop policy if exists question_versions_write on public.question_versions;
create policy question_versions_write on public.question_versions
for all using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
)
with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

-- ==============================================================================
-- 7. POLICIES: CBT EXAM ENGINE
-- ==============================================================================

-- EXAM PACKAGES
drop policy if exists exam_packages_select on public.exam_packages;
create policy exam_packages_select on public.exam_packages
for select using (
  public.current_app_can_manage_exams(school_id)
  or public.current_student_has_exam_package(id)
);

drop policy if exists exam_packages_write on public.exam_packages;
create policy exam_packages_write on public.exam_packages
for all using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

-- EXAM PACKAGE QUESTIONS
drop policy if exists exam_package_questions_select on public.exam_package_questions;
create policy exam_package_questions_select on public.exam_package_questions
for select using (
  exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and (
        public.current_app_can_manage_exams(ep.school_id)
        or public.current_student_has_exam_package(ep.id)
      )
  )
);

drop policy if exists exam_package_questions_write on public.exam_package_questions;
create policy exam_package_questions_write on public.exam_package_questions
for all using (
  exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and public.current_app_can_manage_exams(ep.school_id)
  )
)
with check (
  exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and public.current_app_can_manage_exams(ep.school_id)
  )
);

-- EXAM SCHEDULES
drop policy if exists exam_schedules_select on public.exam_schedules;
create policy exam_schedules_select on public.exam_schedules
for select using (public.current_app_can_read_exam_schedule(id));

drop policy if exists exam_schedules_write on public.exam_schedules;
create policy exam_schedules_write on public.exam_schedules
for all using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

-- EXAM SCHEDULE CLASSES
drop policy if exists exam_schedule_classes_select on public.exam_schedule_classes;
create policy exam_schedule_classes_select on public.exam_schedule_classes
for select using (public.current_app_can_read_exam_schedule(exam_schedule_id));

drop policy if exists exam_schedule_classes_write on public.exam_schedule_classes;
create policy exam_schedule_classes_write on public.exam_schedule_classes
for all using (public.current_app_can_manage_exam_schedule(exam_schedule_id))
with check (public.current_app_can_manage_exam_schedule(exam_schedule_id));

-- EXAM PROCTORS
drop policy if exists exam_proctors_select on public.exam_proctors;
create policy exam_proctors_select on public.exam_proctors
for select using (
  public.current_app_can_manage_exams(school_id)
  or (
    teacher_id = public.current_app_user_id()
    and public.current_app_can_read_school(school_id)
  )
);

drop policy if exists exam_proctors_write on public.exam_proctors;
create policy exam_proctors_write on public.exam_proctors
for all using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

-- EXAM PARTICIPANTS
drop policy if exists exam_participants_select on public.exam_participants;
create policy exam_participants_select on public.exam_participants
for select using (public.current_app_can_read_exam_participant(id));

drop policy if exists exam_participants_insert on public.exam_participants;
create policy exam_participants_insert on public.exam_participants
for insert with check (public.current_app_can_manage_exam_schedule(exam_schedule_id));

drop policy if exists exam_participants_update on public.exam_participants;
create policy exam_participants_update on public.exam_participants
for update using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
)
with check (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_participants_delete on public.exam_participants;
create policy exam_participants_delete on public.exam_participants
for delete using (public.current_app_can_manage_exam_schedule(exam_schedule_id));

-- EXAM ATTEMPTS
drop policy if exists exam_attempts_select on public.exam_attempts;
create policy exam_attempts_select on public.exam_attempts
for select using (public.current_app_can_read_exam_attempt(id));

drop policy if exists exam_attempts_insert on public.exam_attempts;
create policy exam_attempts_insert on public.exam_attempts
for insert with check (
  public.current_student_can_start_exam_attempt(
    exam_participant_id,
    exam_schedule_id,
    student_id
  )
  or public.current_app_can_manage_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_attempts_update on public.exam_attempts;
create policy exam_attempts_update on public.exam_attempts
for update using (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
)
with check (
  student_id = public.current_app_user_id()
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_attempts_delete on public.exam_attempts;
create policy exam_attempts_delete on public.exam_attempts
for delete using (public.current_app_can_manage_exam_schedule(exam_schedule_id));

-- EXAM ANSWERS
drop policy if exists exam_answers_select on public.exam_answers;
create policy exam_answers_select on public.exam_answers
for select using (public.current_app_can_read_exam_attempt(exam_attempt_id));

drop policy if exists exam_answers_insert on public.exam_answers;
create policy exam_answers_insert on public.exam_answers
for insert with check (
  public.current_student_can_write_exam_answer(exam_attempt_id, question_id)
);

drop policy if exists exam_answers_update on public.exam_answers;
create policy exam_answers_update on public.exam_answers
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

drop policy if exists exam_answers_delete on public.exam_answers;
create policy exam_answers_delete on public.exam_answers
for delete using (
  exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and public.current_app_can_manage_exam_schedule(ea.exam_schedule_id)
  )
);

-- EXAM EVENTS
drop policy if exists exam_events_select on public.exam_events;
create policy exam_events_select on public.exam_events
for select using (
  public.current_app_can_read_exam_attempt(exam_attempt_id)
);

drop policy if exists exam_events_insert on public.exam_events;
create policy exam_events_insert on public.exam_events
for insert with check (
  public.current_student_can_write_exam_event(exam_attempt_id, exam_schedule_id, student_id)
  or public.current_app_can_monitor_exam_schedule(exam_schedule_id)
);

drop policy if exists exam_events_delete on public.exam_events;
create policy exam_events_delete on public.exam_events
for delete using (public.current_app_is_super_admin());

-- ==============================================================================
-- 8. POLICIES: GOVERNANCE & AUDIT TRAIL
-- ==============================================================================

-- AUDIT LOGS (Append-only immutable audit trail)
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
for select using (public.current_app_is_super_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
for insert with check (auth.uid() is not null);

drop policy if exists audit_logs_no_update on public.audit_logs;
create policy audit_logs_no_update on public.audit_logs
for update using (false) with check (false);

drop policy if exists audit_logs_no_delete on public.audit_logs;
create policy audit_logs_no_delete on public.audit_logs
for delete using (false);

-- SYSTEM SETTINGS
drop policy if exists system_settings_select on public.system_settings;
create policy system_settings_select on public.system_settings
for select using (public.current_app_is_super_admin());

drop policy if exists system_settings_write on public.system_settings;
create policy system_settings_write on public.system_settings
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- SUPER ADMIN IMPORT JOBS
drop policy if exists super_admin_import_jobs_select on public.super_admin_import_jobs;
create policy super_admin_import_jobs_select on public.super_admin_import_jobs
for select using (public.current_app_is_super_admin());

drop policy if exists super_admin_import_jobs_write on public.super_admin_import_jobs;
create policy super_admin_import_jobs_write on public.super_admin_import_jobs
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- SUPER ADMIN BACKUP JOBS
drop policy if exists super_admin_backup_jobs_select on public.super_admin_backup_jobs;
create policy super_admin_backup_jobs_select on public.super_admin_backup_jobs
for select using (public.current_app_is_super_admin());

drop policy if exists super_admin_backup_jobs_write on public.super_admin_backup_jobs;
create policy super_admin_backup_jobs_write on public.super_admin_backup_jobs
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

-- ==============================================================================
-- 9. EXECUTION PRIVILEGES FOR SECURITY DEFINER FUNCTIONS
-- ==============================================================================

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
revoke execute on function public.current_app_can_read_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_manage_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_monitor_exam_schedule(uuid) from public, anon;
revoke execute on function public.current_app_can_read_exam_participant(uuid) from public, anon;
revoke execute on function public.current_app_can_read_exam_attempt(uuid) from public, anon;
revoke execute on function public.current_student_can_start_exam_attempt(uuid, uuid, uuid) from public, anon;
revoke execute on function public.current_student_can_write_exam_answer(uuid, uuid) from public, anon;
revoke execute on function public.current_student_can_write_exam_event(uuid, uuid, uuid) from public, anon;

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
grant execute on function public.current_app_can_read_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_manage_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_monitor_exam_schedule(uuid) to authenticated;
grant execute on function public.current_app_can_read_exam_participant(uuid) to authenticated;
grant execute on function public.current_app_can_read_exam_attempt(uuid) to authenticated;
grant execute on function public.current_student_can_start_exam_attempt(uuid, uuid, uuid) to authenticated;
grant execute on function public.current_student_can_write_exam_answer(uuid, uuid) to authenticated;
grant execute on function public.current_student_can_write_exam_event(uuid, uuid, uuid) to authenticated;
