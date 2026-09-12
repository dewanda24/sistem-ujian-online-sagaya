-- Heal inconsistent manual data entry during testing
-- Ensures all students are in a class, and data relationships share the correct school_id
-- Safely ignores orphaned data to avoid Unique Constraint errors

begin;

do $$
declare
  v_school_id uuid;
  v_academic_year_id uuid;
  v_semester_id uuid;
  v_class_id uuid;
begin
  -- 1. Dapatkan sekolah aktif (ambil yang pertama)
  select id into v_school_id from public.schools where is_active = true limit 1;
  if v_school_id is null then
    select id into v_school_id from public.schools limit 1;
  end if;

  -- Jika masih tidak ada sekolah, jangan lanjutkan
  if v_school_id is not null then

    -- Update guru/admin/siswa agar terikat pada sekolah ini
    update public.users set school_id = v_school_id where school_id is null;

    -- 2. Pastikan ada minimal 1 Academic Year aktif di sekolah ini
    select id into v_academic_year_id from public.academic_years where is_active = true and school_id = v_school_id limit 1;
    if v_academic_year_id is null then
      select id into v_academic_year_id from public.academic_years where school_id = v_school_id limit 1;
      if v_academic_year_id is not null then
        update public.academic_years set is_active = true where id = v_academic_year_id;
      else
        insert into public.academic_years (school_id, name, start_year, end_year, is_active)
        values (v_school_id, 'Tahun Ajaran Aktif', 2024, 2025, true)
        returning id into v_academic_year_id;
      end if;
    end if;

    -- 3. Pastikan ada minimal 1 Semester aktif (Semester terikat ke Academic Year, bukan langsung ke school_id)
    select id into v_semester_id from public.semesters where is_active = true and academic_year_id = v_academic_year_id limit 1;
    if v_semester_id is null then
      select id into v_semester_id from public.semesters where academic_year_id = v_academic_year_id limit 1;
      if v_semester_id is not null then
        update public.semesters set is_active = true where id = v_semester_id;
      else
        insert into public.semesters (academic_year_id, name, type, is_active)
        values (v_academic_year_id, 'Semester Aktif', 'odd', true)
        returning id into v_semester_id;
      end if;
    end if;

    -- 4. Pastikan ada minimal 1 Kelas di sekolah ini
    select id into v_class_id from public.classes where school_id = v_school_id and is_active = true limit 1;
    if v_class_id is null then
      insert into public.classes (school_id, name, level, is_active)
      values (v_school_id, 'Kelas Utama', 10, true)
      returning id into v_class_id;
    end if;

    -- 5. Gabungkan semua siswa ke kelas utama jika mereka belum punya kelas di tahun ajaran ini
    insert into public.student_classes (student_id, class_id, academic_year_id)
    select u.id, v_class_id, v_academic_year_id
    from public.users u
    join public.roles r on u.role_id = r.id
    where r.name = 'student'
      and u.school_id = v_school_id
      and not exists (
        select 1 from public.student_classes sc
        where sc.student_id = u.id and sc.academic_year_id = v_academic_year_id
      )
    on conflict do nothing;

  end if;
end $$;

commit;
