-- Rollback for 20260607_rls_role_hardening_draft.sql.
-- Use only if staging/production validation shows regressions.

begin;

-- =====================================================
-- DROP V2 POLICIES
-- =====================================================

drop policy if exists roles_select_current_or_admin_v2 on public.roles;
drop policy if exists roles_insert_super_admin_v2 on public.roles;
drop policy if exists roles_update_super_admin_v2 on public.roles;
drop policy if exists roles_delete_super_admin_v2 on public.roles;
drop policy if exists permissions_select_current_or_admin_v2 on public.permissions;
drop policy if exists permissions_insert_super_admin_v2 on public.permissions;
drop policy if exists permissions_update_super_admin_v2 on public.permissions;
drop policy if exists permissions_delete_super_admin_v2 on public.permissions;
drop policy if exists role_permissions_select_current_or_admin_v2 on public.role_permissions;
drop policy if exists role_permissions_insert_super_admin_v2 on public.role_permissions;
drop policy if exists role_permissions_update_super_admin_v2 on public.role_permissions;
drop policy if exists role_permissions_delete_super_admin_v2 on public.role_permissions;
drop policy if exists user_profiles_select_scoped_v2 on public.user_profiles;
drop policy if exists user_profiles_insert_scoped_v2 on public.user_profiles;
drop policy if exists user_profiles_update_scoped_v2 on public.user_profiles;
drop policy if exists user_profiles_delete_admin_v2 on public.user_profiles;
drop policy if exists audit_logs_select_super_admin_v2 on public.audit_logs;
drop policy if exists audit_logs_insert_authenticated_v2 on public.audit_logs;
drop policy if exists audit_logs_update_none_v2 on public.audit_logs;
drop policy if exists audit_logs_delete_none_v2 on public.audit_logs;

drop policy if exists users_select_scoped_v2 on public.users;
drop policy if exists users_insert_admin_v2 on public.users;
drop policy if exists users_update_admin_v2 on public.users;
drop policy if exists users_delete_admin_v2 on public.users;
drop policy if exists academic_years_select_school_v2 on public.academic_years;
drop policy if exists academic_years_insert_admin_v2 on public.academic_years;
drop policy if exists academic_years_update_admin_v2 on public.academic_years;
drop policy if exists academic_years_delete_admin_v2 on public.academic_years;
drop policy if exists semesters_select_school_v2 on public.semesters;
drop policy if exists semesters_insert_admin_v2 on public.semesters;
drop policy if exists semesters_update_admin_v2 on public.semesters;
drop policy if exists semesters_delete_admin_v2 on public.semesters;
drop policy if exists classes_select_school_v2 on public.classes;
drop policy if exists classes_insert_admin_v2 on public.classes;
drop policy if exists classes_update_admin_v2 on public.classes;
drop policy if exists classes_delete_admin_v2 on public.classes;
drop policy if exists subjects_select_school_v2 on public.subjects;
drop policy if exists subjects_insert_admin_v2 on public.subjects;
drop policy if exists subjects_update_admin_v2 on public.subjects;
drop policy if exists subjects_delete_admin_v2 on public.subjects;
drop policy if exists teacher_subjects_select_scoped_v2 on public.teacher_subjects;
drop policy if exists teacher_subjects_insert_admin_v2 on public.teacher_subjects;
drop policy if exists teacher_subjects_update_admin_v2 on public.teacher_subjects;
drop policy if exists teacher_subjects_delete_admin_v2 on public.teacher_subjects;
drop policy if exists class_members_select_scoped_v2 on public.class_members;
drop policy if exists class_members_insert_admin_v2 on public.class_members;
drop policy if exists class_members_update_admin_v2 on public.class_members;
drop policy if exists class_members_delete_admin_v2 on public.class_members;
drop policy if exists student_classes_select_scoped_v2 on public.student_classes;
drop policy if exists student_classes_insert_admin_v2 on public.student_classes;
drop policy if exists student_classes_update_admin_v2 on public.student_classes;
drop policy if exists student_classes_delete_admin_v2 on public.student_classes;

drop policy if exists question_categories_select_manager_v2 on public.question_categories;
drop policy if exists question_categories_insert_manager_v2 on public.question_categories;
drop policy if exists question_categories_update_manager_v2 on public.question_categories;
drop policy if exists question_categories_delete_manager_v2 on public.question_categories;
drop policy if exists question_stimuli_select_scoped_v2 on public.question_stimuli;
drop policy if exists question_stimuli_insert_manager_v2 on public.question_stimuli;
drop policy if exists question_stimuli_update_manager_v2 on public.question_stimuli;
drop policy if exists question_stimuli_delete_manager_v2 on public.question_stimuli;
drop policy if exists questions_select_scoped_v2 on public.questions;
drop policy if exists questions_insert_manager_v2 on public.questions;
drop policy if exists questions_update_manager_v2 on public.questions;
drop policy if exists questions_delete_manager_v2 on public.questions;
drop policy if exists question_options_select_scoped_v2 on public.question_options;
drop policy if exists question_options_insert_manager_v2 on public.question_options;
drop policy if exists question_options_update_manager_v2 on public.question_options;
drop policy if exists question_options_delete_manager_v2 on public.question_options;
drop policy if exists question_attachments_select_scoped_v2 on public.question_attachments;
drop policy if exists question_attachments_insert_manager_v2 on public.question_attachments;
drop policy if exists question_attachments_update_manager_v2 on public.question_attachments;
drop policy if exists question_attachments_delete_manager_v2 on public.question_attachments;
drop policy if exists question_versions_select_manager_v2 on public.question_versions;
drop policy if exists question_versions_insert_manager_v2 on public.question_versions;
drop policy if exists question_versions_update_none_v2 on public.question_versions;
drop policy if exists question_versions_delete_super_admin_v2 on public.question_versions;

drop policy if exists exam_packages_select_scoped_v2 on public.exam_packages;
drop policy if exists exam_packages_insert_manager_v2 on public.exam_packages;
drop policy if exists exam_packages_update_manager_v2 on public.exam_packages;
drop policy if exists exam_packages_delete_manager_v2 on public.exam_packages;
drop policy if exists exam_package_questions_select_scoped_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_insert_manager_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_update_manager_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_delete_manager_v2 on public.exam_package_questions;
drop policy if exists exam_schedules_select_scoped_v2 on public.exam_schedules;
drop policy if exists exam_schedules_insert_manager_v2 on public.exam_schedules;
drop policy if exists exam_schedules_update_manager_v2 on public.exam_schedules;
drop policy if exists exam_schedules_delete_manager_v2 on public.exam_schedules;
drop policy if exists exam_schedule_classes_select_scoped_v2 on public.exam_schedule_classes;
drop policy if exists exam_schedule_classes_insert_manager_v2 on public.exam_schedule_classes;
drop policy if exists exam_schedule_classes_update_manager_v2 on public.exam_schedule_classes;
drop policy if exists exam_schedule_classes_delete_manager_v2 on public.exam_schedule_classes;
drop policy if exists exam_participants_select_scoped_v2 on public.exam_participants;
drop policy if exists exam_participants_insert_manager_v2 on public.exam_participants;
drop policy if exists exam_participants_update_scoped_v2 on public.exam_participants;
drop policy if exists exam_participants_delete_manager_v2 on public.exam_participants;
drop policy if exists exam_attempts_select_scoped_v2 on public.exam_attempts;
drop policy if exists exam_attempts_insert_student_or_manager_v2 on public.exam_attempts;
drop policy if exists exam_attempts_update_student_or_monitor_v2 on public.exam_attempts;
drop policy if exists exam_attempts_delete_manager_v2 on public.exam_attempts;
drop policy if exists exam_answers_select_scoped_v2 on public.exam_answers;
drop policy if exists exam_answers_insert_student_v2 on public.exam_answers;
drop policy if exists exam_answers_update_student_or_manager_v2 on public.exam_answers;
drop policy if exists exam_answers_delete_manager_v2 on public.exam_answers;
drop policy if exists exam_events_select_scoped_v2 on public.exam_events;
drop policy if exists exam_events_insert_student_or_monitor_v2 on public.exam_events;
drop policy if exists exam_events_update_none_v2 on public.exam_events;
drop policy if exists exam_events_delete_super_admin_v2 on public.exam_events;

-- P0 had no migration-backed old RLS policies. Disable to restore repo migration baseline.
alter table public.roles disable row level security;
alter table public.permissions disable row level security;
alter table public.role_permissions disable row level security;
alter table public.user_profiles disable row level security;
alter table public.audit_logs disable row level security;

-- =====================================================
-- RESTORE BROAD TENANT POLICIES FROM 20260602
-- =====================================================

drop policy if exists users_tenant_write on public.users;
create policy users_tenant_write on public.users
for all using (
  public.current_app_is_super_admin()
  or school_id = public.current_app_school_id()
)
with check (
  public.current_app_is_super_admin()
  or school_id = public.current_app_school_id()
);

drop policy if exists academic_years_tenant_all on public.academic_years;
create policy academic_years_tenant_all on public.academic_years
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists semesters_tenant_all on public.semesters;
create policy semesters_tenant_all on public.semesters
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.academic_years ay
    where ay.id = academic_year_id
      and ay.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.academic_years ay
    where ay.id = academic_year_id
      and ay.school_id = public.current_app_school_id()
  )
);

drop policy if exists classes_tenant_all on public.classes;
create policy classes_tenant_all on public.classes
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists subjects_tenant_all on public.subjects;
create policy subjects_tenant_all on public.subjects
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists question_categories_tenant_all on public.question_categories;
create policy question_categories_tenant_all on public.question_categories
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists question_stimuli_tenant_all on public.question_stimuli;
create policy question_stimuli_tenant_all on public.question_stimuli
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists questions_tenant_all on public.questions;
create policy questions_tenant_all on public.questions
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists exam_packages_tenant_all on public.exam_packages;
create policy exam_packages_tenant_all on public.exam_packages
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists exam_schedules_tenant_all on public.exam_schedules;
create policy exam_schedules_tenant_all on public.exam_schedules
for all using (public.can_access_school(school_id))
with check (public.can_access_school(school_id));

drop policy if exists exam_package_questions_tenant_all on public.exam_package_questions;
create policy exam_package_questions_tenant_all on public.exam_package_questions
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and ep.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and ep.school_id = public.current_app_school_id()
  )
);

drop policy if exists exam_schedule_classes_tenant_all on public.exam_schedule_classes;
create policy exam_schedule_classes_tenant_all on public.exam_schedule_classes
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
);

drop policy if exists exam_participants_tenant_all on public.exam_participants;
create policy exam_participants_tenant_all on public.exam_participants
for all using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
);

drop policy if exists exam_attempts_tenant_all on public.exam_attempts;
create policy exam_attempts_tenant_all on public.exam_attempts
for all using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
);

drop policy if exists exam_answers_tenant_all on public.exam_answers;
create policy exam_answers_tenant_all on public.exam_answers
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and (
        ea.student_id = public.current_app_user_id()
        or exists (
          select 1 from public.exam_schedules es
          where es.id = ea.exam_schedule_id
            and es.school_id = public.current_app_school_id()
        )
      )
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1
    from public.exam_attempts ea
    where ea.id = exam_attempt_id
      and (
        ea.student_id = public.current_app_user_id()
        or exists (
          select 1 from public.exam_schedules es
          where es.id = ea.exam_schedule_id
            and es.school_id = public.current_app_school_id()
        )
      )
  )
);

drop policy if exists exam_events_tenant_all on public.exam_events;
create policy exam_events_tenant_all on public.exam_events
for all using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and es.school_id = public.current_app_school_id()
  )
);

drop policy if exists question_options_tenant_all on public.question_options;
create policy question_options_tenant_all on public.question_options
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
);

drop policy if exists teacher_subjects_tenant_all on public.teacher_subjects;
create policy teacher_subjects_tenant_all on public.teacher_subjects
for all using (
  public.current_app_is_super_admin()
  or teacher_id = public.current_app_user_id()
  or exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and s.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and s.school_id = public.current_app_school_id()
  )
);

drop policy if exists student_classes_tenant_all on public.student_classes;
create policy student_classes_tenant_all on public.student_classes
for all using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
  )
);

drop policy if exists class_members_tenant_all on public.class_members;
create policy class_members_tenant_all on public.class_members
for all using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
  )
);

drop policy if exists question_attachments_tenant_all on public.question_attachments;
create policy question_attachments_tenant_all on public.question_attachments
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
);

drop policy if exists question_versions_tenant_all on public.question_versions;
create policy question_versions_tenant_all on public.question_versions
for all using (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
)
with check (
  public.current_app_is_super_admin()
  or exists (
    select 1 from public.questions q
    where q.id = question_id
      and q.school_id = public.current_app_school_id()
  )
);

commit;
