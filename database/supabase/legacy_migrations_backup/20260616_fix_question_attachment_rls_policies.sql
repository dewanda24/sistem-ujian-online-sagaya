-- Ensure question attachments can be maintained by question bank managers.
-- A previous replacement migration restored SELECT but did not recreate the
-- INSERT/UPDATE/DELETE policies, which can block saving questions with media.

drop policy if exists question_attachments_insert_manager_v2 on public.question_attachments;
drop policy if exists question_attachments_update_manager_v2 on public.question_attachments;
drop policy if exists question_attachments_delete_manager_v2 on public.question_attachments;

create policy question_attachments_insert_manager_v2 on public.question_attachments
for insert with check (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);

create policy question_attachments_update_manager_v2 on public.question_attachments
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

create policy question_attachments_delete_manager_v2 on public.question_attachments
for delete using (
  exists (
    select 1 from public.questions q
    where q.id = question_id
      and public.current_app_can_manage_questions(q.school_id)
  )
);
