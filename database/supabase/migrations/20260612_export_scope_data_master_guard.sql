-- Sprint: Export Scope Audit + Data Master Guard

-- =====================================================
-- EXPORT PERMISSIONS
-- =====================================================

insert into public.permissions (code, module, action)
values
  ('question_bank.export', 'question_bank', 'export')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name in ('super_admin', 'admin', 'teacher')
and p.code = 'question_bank.export'
on conflict do nothing;

-- =====================================================
-- UNIQUE MASTER DATA IDENTIFIERS
-- =====================================================

create unique index if not exists uq_users_username_ci
on public.users(lower(username))
where username is not null and btrim(username) <> '';

create unique index if not exists uq_users_email_ci
on public.users(lower(email))
where email is not null and btrim(email) <> '';

create unique index if not exists uq_user_profiles_nis
on public.user_profiles(nis)
where nis is not null and btrim(nis) <> '';

create unique index if not exists uq_user_profiles_nisn
on public.user_profiles(nisn)
where nisn is not null and btrim(nisn) <> '';

create unique index if not exists uq_user_profiles_nip
on public.user_profiles(nip)
where nip is not null and btrim(nip) <> '';

create unique index if not exists uq_subjects_school_code_ci
on public.subjects(school_id, lower(code))
where code is not null and btrim(code) <> '';

-- =====================================================
-- ACTIVE ACADEMIC PERIOD GUARDS
-- =====================================================

create unique index if not exists uq_academic_years_one_active_per_school
on public.academic_years(school_id)
where is_active = true;

create or replace function public.assert_single_active_semester_per_school()
returns trigger
language plpgsql
as $$
declare
  target_school_id uuid;
  conflicting_semester_id uuid;
begin
  if new.is_active is not true then
    return new;
  end if;

  select ay.school_id
    into target_school_id
  from public.academic_years ay
  where ay.id = new.academic_year_id;

  if target_school_id is null then
    raise exception 'Semester academic_year_id % tidak valid.', new.academic_year_id;
  end if;

  select s.id
    into conflicting_semester_id
  from public.semesters s
  join public.academic_years ay on ay.id = s.academic_year_id
  where ay.school_id = target_school_id
    and s.is_active = true
    and s.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if conflicting_semester_id is not null then
    raise exception 'Hanya satu semester aktif yang diperbolehkan untuk setiap sekolah.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_single_active_semester_per_school on public.semesters;
create trigger trg_single_active_semester_per_school
before insert or update of is_active, academic_year_id on public.semesters
for each row
execute function public.assert_single_active_semester_per_school();
