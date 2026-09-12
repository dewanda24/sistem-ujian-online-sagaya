-- Retire legacy broad tenant policies that can override the stricter v2
-- and production hardening policies through PostgreSQL's permissive RLS OR
-- semantics.

begin;

drop policy if exists users_tenant_write on public.users;

drop policy if exists academic_years_tenant_all on public.academic_years;
drop policy if exists semesters_tenant_all on public.semesters;
drop policy if exists classes_tenant_all on public.classes;
drop policy if exists subjects_tenant_all on public.subjects;

drop policy if exists teacher_subjects_tenant_all on public.teacher_subjects;
drop policy if exists student_classes_tenant_all on public.student_classes;
drop policy if exists class_members_tenant_all on public.class_members;

drop policy if exists question_categories_tenant_all on public.question_categories;
drop policy if exists question_stimuli_tenant_all on public.question_stimuli;
drop policy if exists questions_tenant_all on public.questions;
drop policy if exists question_options_tenant_all on public.question_options;
drop policy if exists question_attachments_tenant_all on public.question_attachments;
drop policy if exists question_versions_tenant_all on public.question_versions;

drop policy if exists exam_packages_tenant_all on public.exam_packages;
drop policy if exists exam_package_questions_tenant_all on public.exam_package_questions;
drop policy if exists exam_schedules_tenant_all on public.exam_schedules;
drop policy if exists exam_schedule_classes_tenant_all on public.exam_schedule_classes;
drop policy if exists exam_participants_tenant_all on public.exam_participants;
drop policy if exists exam_attempts_tenant_all on public.exam_attempts;
drop policy if exists exam_answers_tenant_all on public.exam_answers;
drop policy if exists exam_events_tenant_all on public.exam_events;

commit;
