# Sagaya RLS Production Readiness

Date: 2026-06-12
Environment verified: staging
Result: 73/74 checks passed

## Executive Summary

RLS hardening for Sagaya multi-school CBT is ready for production rollout after staging verification. The one remaining failed check is not an RLS defect: staging does not yet have a dedicated proctor user with `auth_user_id`. Proctor policy behavior was still covered by assigning `teacherA` as a proctor and verifying same-school access plus cross-school denial.

## Migration Files

Run these production migrations in this order:

1. `database/supabase/migrations/20260612_create_question_media_bucket.sql`
2. `database/supabase/migrations/20260612_production_rls_hardening.sql`
3. `database/supabase/migrations/20260612_retire_legacy_tenant_policies.sql`
4. `database/supabase/migrations/20260612_zz_restore_scoped_v2_replacement_policies.sql`
5. `database/supabase/migrations/20260612_zzz_fix_exam_rls_recursion.sql`
6. `database/supabase/migrations/20260612_zzzz_fix_exam_attempt_returning_rls.sql`

## Endpoint Changes

Updated upload endpoint:

- `src/app/api/question-bank/media/route.ts`

Behavior:

- Requires authenticated user with `school_id`.
- Upload path format is `{school_id}/{user_id}/{date}/{uuid}`.
- Uses private `question-media` bucket.
- Returns signed URL and `storage_path`.

## Policies Dropped

Retired broad legacy tenant policies:

- `users_tenant_select`
- `users_tenant_write`
- `academic_years_tenant_all`
- `semesters_tenant_all`
- `classes_tenant_all`
- `subjects_tenant_all`
- `teacher_subjects_tenant_all`
- `student_classes_tenant_all`
- `class_members_tenant_all`
- `question_categories_tenant_all`
- `question_stimuli_tenant_all`
- `questions_tenant_all`
- `question_options_tenant_all`
- `question_attachments_tenant_all`
- `question_versions_tenant_all`
- `exam_packages_tenant_all`
- `exam_package_questions_tenant_all`
- `exam_schedules_tenant_all`
- `exam_schedule_classes_tenant_all`
- `exam_participants_tenant_all`
- `exam_attempts_tenant_all`
- `exam_answers_tenant_all`
- `exam_events_tenant_all`

## New/Restored Policies

Core hardened areas:

- `exam_proctors`: scoped select for exam managers or assigned teacher; write only exam managers.
- `system_settings`: super admin only.
- `super_admin_import_jobs`: super admin only.
- `super_admin_backup_jobs`: super admin only.
- `audit_logs`: insert requires `user_id = current_app_user_id()`.
- `question-media` storage: private bucket, school-prefix based access.
- `users`: super admin global, self, or same-school admin/teacher/proctor/principal.
- `questions`: question managers or students only when question belongs to their exam package context.
- `exam_schedules`, `exam_participants`, `exam_attempts`, `exam_answers`, `exam_events`: scoped by student ownership, school monitor/manage helpers, and consistency checks.

## New Triggers

Production hardening adds consistency triggers for:

- `exam_attempts`
- `exam_answers`
- `exam_events`
- `exam_participants`

Validated protections:

- Attempt participant/schedule/student mismatch is rejected.
- Answer question outside exam package is rejected.
- Event attempt/schedule/student mismatch is rejected.
- Student cannot rewrite participant ownership.

## Helper Hardening

Internal helper execution is revoked from `public` and `anon`, then granted only to `authenticated` where needed by RLS policies.

Important helpers covered:

- `current_app_user_id()`
- `current_app_role_name()`
- `current_app_school_id()`
- `current_app_is_super_admin()`
- `can_access_school()`
- `current_app_can_manage_exams(uuid)`
- `current_app_can_manage_questions(uuid)`
- `current_app_can_monitor_exam_schedule(uuid)`
- `current_student_can_start_exam_attempt(uuid, uuid, uuid)`
- `current_student_can_write_exam_answer(uuid, uuid)`
- `current_student_can_write_exam_event(uuid, uuid, uuid)`

## Staging Verification

Command:

```powershell
node scripts/rls-verify-staging.mjs
```

Latest result:

- Total: 74
- Passed: 73
- Failed: 1

Passed evidence highlights:

- Admin/teacher/student school A cannot read school B data.
- Student cannot read another student user.
- Student cannot read question bank questions without exam context.
- Student can create own valid attempt.
- Student cannot create attempt with another student's participant.
- Student can insert answer for package question.
- Student cannot insert answer for question outside package.
- Student cannot insert answer/event for another student's attempt.
- Storage object from school A cannot be downloaded by school B user.
- Student cannot upload to `question-media`.
- Export endpoints are guarded by auth, permission, and school scope checks.

Remaining failed check:

- Dedicated proctor account is not available in staging.
- Evidence: no existing proctor user with `auth_user_id`.
- Mitigation: create/seed a real staging proctor user, then rerun matrix.

## Production Rollout Runbook

1. Take database backup.
2. Apply migrations in the order listed above.
3. Confirm each SQL file finishes without error.
4. Run static checks locally:

```powershell
npx tsc --noEmit
npm run lint
```

5. Run staging verification after production-like deploy:

```powershell
node scripts/rls-verify-staging.mjs
```

6. Run production smoke tests with real accounts:

- Super admin can read global admin data.
- Admin A cannot read school B.
- Admin B cannot read school A.
- Teacher A can manage question bank for school A only.
- Student A can see own schedule/participant only.
- Student A can start own attempt.
- Student A can save answer for package question.
- Student A cannot answer question outside package.
- Student B cannot read/download school A storage object.
- Export endpoint returns only scoped school data.

## Remaining Risks

- Staging lacks dedicated proctor account; add seed data for full role-matrix coverage.
- Production deploy still needs manual SQL execution because Supabase CLI was not responsive in this workstation.
- Production smoke test should avoid broad destructive mutations; use dedicated test records and clean them after verification.
