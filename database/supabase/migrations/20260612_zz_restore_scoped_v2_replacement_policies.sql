-- Restore strict scoped policies that replace the retired legacy tenant_all
-- policies. This keeps tenant isolation tight while preserving legitimate
-- school/admin/teacher/student CBT workflows.

begin;

-- =====================================================
-- USERS AND MASTER DATA
-- =====================================================

drop policy if exists users_select_scoped_v2 on public.users;
drop policy if exists users_insert_admin_v2 on public.users;
drop policy if exists users_update_admin_v2 on public.users;
drop policy if exists users_delete_admin_v2 on public.users;

create policy users_select_scoped_v2 on public.users
for select using (
  public.current_app_is_super_admin()
  or id = public.current_app_user_id()
  or (
    school_id = public.current_app_school_id()
    and public.current_app_has_role(array['admin','teacher','proctor','principal'])
  )
);

create policy users_insert_admin_v2 on public.users
for insert with check (public.current_app_can_admin_school(school_id));

create policy users_update_admin_v2 on public.users
for update using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

create policy users_delete_admin_v2 on public.users
for delete using (public.current_app_can_admin_school(school_id));

drop policy if exists academic_years_select_school_v2 on public.academic_years;
drop policy if exists academic_years_insert_admin_v2 on public.academic_years;
drop policy if exists academic_years_update_admin_v2 on public.academic_years;
drop policy if exists academic_years_delete_admin_v2 on public.academic_years;

create policy academic_years_select_school_v2 on public.academic_years
for select using (public.current_app_can_read_school(school_id));

create policy academic_years_insert_admin_v2 on public.academic_years
for insert with check (public.current_app_can_admin_school(school_id));

create policy academic_years_update_admin_v2 on public.academic_years
for update using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

create policy academic_years_delete_admin_v2 on public.academic_years
for delete using (public.current_app_can_admin_school(school_id));

drop policy if exists classes_select_school_v2 on public.classes;
drop policy if exists classes_insert_admin_v2 on public.classes;
drop policy if exists classes_update_admin_v2 on public.classes;
drop policy if exists classes_delete_admin_v2 on public.classes;

create policy classes_select_school_v2 on public.classes
for select using (public.current_app_can_read_school(school_id));

create policy classes_insert_admin_v2 on public.classes
for insert with check (public.current_app_can_admin_school(school_id));

create policy classes_update_admin_v2 on public.classes
for update using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

create policy classes_delete_admin_v2 on public.classes
for delete using (public.current_app_can_admin_school(school_id));

drop policy if exists subjects_select_school_v2 on public.subjects;
drop policy if exists subjects_insert_admin_v2 on public.subjects;
drop policy if exists subjects_update_admin_v2 on public.subjects;
drop policy if exists subjects_delete_admin_v2 on public.subjects;

create policy subjects_select_school_v2 on public.subjects
for select using (public.current_app_can_read_school(school_id));

create policy subjects_insert_admin_v2 on public.subjects
for insert with check (public.current_app_can_admin_school(school_id));

create policy subjects_update_admin_v2 on public.subjects
for update using (public.current_app_can_admin_school(school_id))
with check (public.current_app_can_admin_school(school_id));

create policy subjects_delete_admin_v2 on public.subjects
for delete using (public.current_app_can_admin_school(school_id));

drop policy if exists teacher_subjects_select_scoped_v2 on public.teacher_subjects;
create policy teacher_subjects_select_scoped_v2 on public.teacher_subjects
for select using (
  public.current_app_is_super_admin()
  or teacher_id = public.current_app_user_id()
  or exists (
    select 1 from public.subjects s
    where s.id = subject_id
      and s.school_id = public.current_app_school_id()
      and public.current_app_has_role(array['admin','principal','proctor'])
  )
);

drop policy if exists class_members_select_scoped_v2 on public.class_members;
create policy class_members_select_scoped_v2 on public.class_members
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

drop policy if exists student_classes_select_scoped_v2 on public.student_classes;
create policy student_classes_select_scoped_v2 on public.student_classes
for select using (
  public.current_app_is_super_admin()
  or student_id = public.current_app_user_id()
  or exists (
    select 1 from public.classes c
    where c.id = class_id
      and c.school_id = public.current_app_school_id()
      and public.current_app_has_role(array['admin','principal','proctor','teacher'])
  )
);

-- =====================================================
-- QUESTION BANK
-- =====================================================

drop policy if exists question_categories_select_manager_v2 on public.question_categories;
drop policy if exists question_categories_insert_manager_v2 on public.question_categories;
drop policy if exists question_categories_update_manager_v2 on public.question_categories;
drop policy if exists question_categories_delete_manager_v2 on public.question_categories;

create policy question_categories_select_manager_v2 on public.question_categories
for select using (public.current_app_can_manage_questions(school_id));

create policy question_categories_insert_manager_v2 on public.question_categories
for insert with check (public.current_app_can_manage_questions(school_id));

create policy question_categories_update_manager_v2 on public.question_categories
for update using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

create policy question_categories_delete_manager_v2 on public.question_categories
for delete using (public.current_app_can_manage_questions(school_id));

drop policy if exists question_stimuli_select_scoped_v2 on public.question_stimuli;
drop policy if exists question_stimuli_insert_manager_v2 on public.question_stimuli;
drop policy if exists question_stimuli_update_manager_v2 on public.question_stimuli;
drop policy if exists question_stimuli_delete_manager_v2 on public.question_stimuli;

create policy question_stimuli_select_scoped_v2 on public.question_stimuli
for select using (
  public.current_app_can_manage_questions(school_id)
  or exists (
    select 1 from public.questions q
    where q.stimulus_id = question_stimuli.id
      and public.current_student_has_question(q.id)
  )
);

create policy question_stimuli_insert_manager_v2 on public.question_stimuli
for insert with check (public.current_app_can_manage_questions(school_id));

create policy question_stimuli_update_manager_v2 on public.question_stimuli
for update using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

create policy question_stimuli_delete_manager_v2 on public.question_stimuli
for delete using (public.current_app_can_manage_questions(school_id));

drop policy if exists questions_select_scoped_v2 on public.questions;
drop policy if exists questions_insert_manager_v2 on public.questions;
drop policy if exists questions_update_manager_v2 on public.questions;
drop policy if exists questions_delete_manager_v2 on public.questions;

create policy questions_select_scoped_v2 on public.questions
for select using (
  public.current_app_can_manage_questions(school_id)
  or public.current_student_has_question(id)
);

create policy questions_insert_manager_v2 on public.questions
for insert with check (public.current_app_can_manage_questions(school_id));

create policy questions_update_manager_v2 on public.questions
for update using (public.current_app_can_manage_questions(school_id))
with check (public.current_app_can_manage_questions(school_id));

create policy questions_delete_manager_v2 on public.questions
for delete using (public.current_app_can_manage_questions(school_id));

drop policy if exists question_options_select_scoped_v2 on public.question_options;
drop policy if exists question_options_insert_manager_v2 on public.question_options;
drop policy if exists question_options_update_manager_v2 on public.question_options;
drop policy if exists question_options_delete_manager_v2 on public.question_options;

create policy question_options_select_scoped_v2 on public.question_options
for select using (public.current_app_can_read_question(question_id));

create policy question_options_insert_manager_v2 on public.question_options
for insert with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

create policy question_options_update_manager_v2 on public.question_options
for update using (
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

create policy question_options_delete_manager_v2 on public.question_options
for delete using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

drop policy if exists question_attachments_select_scoped_v2 on public.question_attachments;
create policy question_attachments_select_scoped_v2 on public.question_attachments
for select using (public.current_app_can_read_question(question_id));

-- =====================================================
-- EXAMS
-- Keep hardened INSERT/UPDATE policies from production hardening.
-- =====================================================

drop policy if exists exam_packages_select_scoped_v2 on public.exam_packages;
drop policy if exists exam_packages_insert_manager_v2 on public.exam_packages;
drop policy if exists exam_packages_update_manager_v2 on public.exam_packages;
drop policy if exists exam_packages_delete_manager_v2 on public.exam_packages;

create policy exam_packages_select_scoped_v2 on public.exam_packages
for select using (
  public.current_app_can_monitor_exams(school_id)
  or public.current_student_has_exam_package(id)
);

create policy exam_packages_insert_manager_v2 on public.exam_packages
for insert with check (public.current_app_can_manage_exams(school_id));

create policy exam_packages_update_manager_v2 on public.exam_packages
for update using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

create policy exam_packages_delete_manager_v2 on public.exam_packages
for delete using (public.current_app_can_manage_exams(school_id));

drop policy if exists exam_package_questions_select_scoped_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_insert_manager_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_update_manager_v2 on public.exam_package_questions;
drop policy if exists exam_package_questions_delete_manager_v2 on public.exam_package_questions;

create policy exam_package_questions_select_scoped_v2 on public.exam_package_questions
for select using (
  public.current_student_has_exam_package(exam_package_id)
  or exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and public.current_app_can_monitor_exams(ep.school_id)
  )
);

create policy exam_package_questions_insert_manager_v2 on public.exam_package_questions
for insert with check (
  exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and public.current_app_can_manage_exams(ep.school_id)
  )
);

create policy exam_package_questions_update_manager_v2 on public.exam_package_questions
for update using (
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

create policy exam_package_questions_delete_manager_v2 on public.exam_package_questions
for delete using (
  exists (
    select 1 from public.exam_packages ep
    where ep.id = exam_package_id
      and public.current_app_can_manage_exams(ep.school_id)
  )
);

drop policy if exists exam_schedules_select_scoped_v2 on public.exam_schedules;
drop policy if exists exam_schedules_insert_manager_v2 on public.exam_schedules;
drop policy if exists exam_schedules_update_manager_v2 on public.exam_schedules;
drop policy if exists exam_schedules_delete_manager_v2 on public.exam_schedules;

create policy exam_schedules_select_scoped_v2 on public.exam_schedules
for select using (
  public.current_app_can_monitor_exams(school_id)
  or exists (
    select 1 from public.exam_participants p
    where p.exam_schedule_id = exam_schedules.id
      and p.student_id = public.current_app_user_id()
  )
);

create policy exam_schedules_insert_manager_v2 on public.exam_schedules
for insert with check (public.current_app_can_manage_exams(school_id));

create policy exam_schedules_update_manager_v2 on public.exam_schedules
for update using (public.current_app_can_manage_exams(school_id))
with check (public.current_app_can_manage_exams(school_id));

create policy exam_schedules_delete_manager_v2 on public.exam_schedules
for delete using (public.current_app_can_manage_exams(school_id));

drop policy if exists exam_schedule_classes_select_scoped_v2 on public.exam_schedule_classes;
create policy exam_schedule_classes_select_scoped_v2 on public.exam_schedule_classes
for select using (
  exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and (
        public.current_app_can_monitor_exams(es.school_id)
        or exists (
          select 1 from public.exam_participants p
          where p.exam_schedule_id = es.id
            and p.student_id = public.current_app_user_id()
        )
      )
  )
);

drop policy if exists exam_participants_select_scoped_v2 on public.exam_participants;
drop policy if exists exam_participants_insert_manager_v2 on public.exam_participants;
drop policy if exists exam_participants_delete_manager_v2 on public.exam_participants;

create policy exam_participants_select_scoped_v2 on public.exam_participants
for select using (
  student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_monitor_exams(es.school_id)
  )
);

create policy exam_participants_insert_manager_v2 on public.exam_participants
for insert with check (
  exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_manage_exams(es.school_id)
  )
);

create policy exam_participants_delete_manager_v2 on public.exam_participants
for delete using (
  exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_manage_exams(es.school_id)
  )
);

drop policy if exists exam_attempts_select_scoped_v2 on public.exam_attempts;
drop policy if exists exam_attempts_delete_manager_v2 on public.exam_attempts;

create policy exam_attempts_select_scoped_v2 on public.exam_attempts
for select using (
  student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_monitor_exams(es.school_id)
  )
);

create policy exam_attempts_delete_manager_v2 on public.exam_attempts
for delete using (
  exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_manage_exams(es.school_id)
  )
);

drop policy if exists exam_answers_select_scoped_v2 on public.exam_answers;
drop policy if exists exam_answers_delete_manager_v2 on public.exam_answers;

create policy exam_answers_select_scoped_v2 on public.exam_answers
for select using (
  exists (
    select 1 from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    where ea.id = exam_attempt_id
      and (
        ea.student_id = public.current_app_user_id()
        or public.current_app_can_monitor_exams(es.school_id)
      )
  )
);

create policy exam_answers_delete_manager_v2 on public.exam_answers
for delete using (
  exists (
    select 1 from public.exam_attempts ea
    join public.exam_schedules es on es.id = ea.exam_schedule_id
    where ea.id = exam_attempt_id
      and public.current_app_can_manage_exams(es.school_id)
  )
);

drop policy if exists exam_events_select_scoped_v2 on public.exam_events;
drop policy if exists exam_events_update_none_v2 on public.exam_events;
drop policy if exists exam_events_delete_super_admin_v2 on public.exam_events;

create policy exam_events_select_scoped_v2 on public.exam_events
for select using (
  student_id = public.current_app_user_id()
  or exists (
    select 1 from public.exam_schedules es
    where es.id = exam_schedule_id
      and public.current_app_can_monitor_exams(es.school_id)
  )
);

create policy exam_events_update_none_v2 on public.exam_events
for update using (false)
with check (false);

create policy exam_events_delete_super_admin_v2 on public.exam_events
for delete using (public.current_app_is_super_admin());

commit;
