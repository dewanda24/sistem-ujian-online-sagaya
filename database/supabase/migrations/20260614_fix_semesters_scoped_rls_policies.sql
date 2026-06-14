-- Restore scoped RLS policies for semesters after retiring legacy tenant policies.
-- The semesters table is scoped through academic_years.school_id, so each policy
-- checks the related academic year instead of a direct school_id column.

begin;

drop policy if exists semesters_select_school_v2 on public.semesters;
drop policy if exists semesters_insert_admin_v2 on public.semesters;
drop policy if exists semesters_update_admin_v2 on public.semesters;
drop policy if exists semesters_delete_admin_v2 on public.semesters;

create policy semesters_select_school_v2 on public.semesters
for select using (
  public.current_app_is_super_admin()
  or exists (
    select 1
    from public.academic_years ay
    where ay.id = academic_year_id
      and ay.school_id = public.current_app_school_id()
  )
);

create policy semesters_insert_admin_v2 on public.semesters
for insert with check (
  exists (
    select 1
    from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
);

create policy semesters_update_admin_v2 on public.semesters
for update using (
  exists (
    select 1
    from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
)
with check (
  exists (
    select 1
    from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
);

create policy semesters_delete_admin_v2 on public.semesters
for delete using (
  exists (
    select 1
    from public.academic_years ay
    where ay.id = academic_year_id
      and public.current_app_can_admin_school(ay.school_id)
  )
);

commit;
