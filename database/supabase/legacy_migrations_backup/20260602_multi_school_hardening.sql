-- Sprint 4: Multi-school hardening
-- Scope: tenant consistency, indexes, and RLS policies for core school-scoped data.

-- =====================================================
-- CURRENT USER HELPERS FOR RLS
-- =====================================================

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
  limit 1
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
  limit 1
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
  limit 1
$$;

create or replace function public.current_app_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role_name() = 'super_admin', false)
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
    )
$$;

-- =====================================================
-- INDEXES AND UNIQUE CONSTRAINTS
-- =====================================================

create unique index if not exists uq_schools_npsn
on public.schools(lower(npsn))
where npsn is not null and btrim(npsn) <> '';

create unique index if not exists uq_academic_years_school_name
on public.academic_years(school_id, lower(name));

create unique index if not exists uq_semesters_academic_year_code
on public.semesters(academic_year_id, lower(code));

create unique index if not exists uq_subjects_school_code
on public.subjects(school_id, lower(code))
where code is not null and btrim(code) <> '';

alter table public.classes
add column if not exists academic_year_id uuid
references public.academic_years(id)
on delete set null;

alter table public.classes
add column if not exists homeroom_teacher_id uuid
references public.users(id)
on delete set null;

create unique index if not exists uq_classes_school_year_name
on public.classes(school_id, academic_year_id, lower(name));

create index if not exists idx_users_role_school
on public.users(role_id, school_id);

create index if not exists idx_exam_participants_class_id
on public.exam_participants(class_id);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  joined_at date not null default current_date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_class_members_student_id
on public.class_members(student_id);

create index if not exists idx_class_members_class_id
on public.class_members(class_id);

create unique index if not exists uq_class_members_student_active
on public.class_members(student_id)
where left_at is null;

-- =====================================================
-- TENANT CONSISTENCY TRIGGERS
-- =====================================================

create or replace function public.assert_exam_package_school_consistency()
returns trigger
language plpgsql
as $$
declare
  subject_school_id uuid;
begin
  select school_id into subject_school_id
  from public.subjects
  where id = new.subject_id;

  if subject_school_id is null or subject_school_id <> new.school_id then
    raise exception 'exam package school_id must match subject school_id';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_package_school_consistency on public.exam_packages;
create trigger assert_exam_package_school_consistency
before insert or update on public.exam_packages
for each row execute function public.assert_exam_package_school_consistency();

create or replace function public.assert_exam_schedule_school_consistency()
returns trigger
language plpgsql
as $$
declare
  package_school_id uuid;
  academic_year_school_id uuid;
  semester_school_id uuid;
begin
  select school_id into package_school_id
  from public.exam_packages
  where id = new.exam_package_id;

  select school_id into academic_year_school_id
  from public.academic_years
  where id = new.academic_year_id;

  if new.semester_id is not null then
    select ay.school_id into semester_school_id
    from public.semesters s
    join public.academic_years ay on ay.id = s.academic_year_id
    where s.id = new.semester_id;
  end if;

  if package_school_id is null or package_school_id <> new.school_id then
    raise exception 'exam schedule school_id must match package school_id';
  end if;

  if academic_year_school_id is null or academic_year_school_id <> new.school_id then
    raise exception 'exam schedule school_id must match academic year school_id';
  end if;

  if new.semester_id is not null and semester_school_id <> new.school_id then
    raise exception 'exam schedule school_id must match semester school_id';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_schedule_school_consistency on public.exam_schedules;
create trigger assert_exam_schedule_school_consistency
before insert or update on public.exam_schedules
for each row execute function public.assert_exam_schedule_school_consistency();

create or replace function public.assert_question_school_consistency()
returns trigger
language plpgsql
as $$
declare
  subject_school_id uuid;
  category_school_id uuid;
  stimulus_school_id uuid;
begin
  select school_id into subject_school_id
  from public.subjects
  where id = new.subject_id;

  if subject_school_id is null or subject_school_id <> new.school_id then
    raise exception 'question school_id must match subject school_id';
  end if;

  if new.category_id is not null then
    select school_id into category_school_id
    from public.question_categories
    where id = new.category_id;

    if category_school_id <> new.school_id then
      raise exception 'question category must be in the same school';
    end if;
  end if;

  if new.stimulus_id is not null then
    select school_id into stimulus_school_id
    from public.question_stimuli
    where id = new.stimulus_id;

    if stimulus_school_id <> new.school_id then
      raise exception 'question stimulus must be in the same school';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists assert_question_school_consistency on public.questions;
create trigger assert_question_school_consistency
before insert or update on public.questions
for each row execute function public.assert_question_school_consistency();

create or replace function public.assert_question_category_school_consistency()
returns trigger
language plpgsql
as $$
declare
  subject_school_id uuid;
begin
  select school_id into subject_school_id
  from public.subjects
  where id = new.subject_id;

  if subject_school_id is null or subject_school_id <> new.school_id then
    raise exception 'question category school_id must match subject school_id';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_question_category_school_consistency on public.question_categories;
create trigger assert_question_category_school_consistency
before insert or update on public.question_categories
for each row execute function public.assert_question_category_school_consistency();

drop trigger if exists assert_question_stimulus_school_consistency on public.question_stimuli;
create trigger assert_question_stimulus_school_consistency
before insert or update on public.question_stimuli
for each row execute function public.assert_question_category_school_consistency();

create or replace function public.assert_exam_schedule_class_school_consistency()
returns trigger
language plpgsql
as $$
declare
  schedule_school_id uuid;
  class_school_id uuid;
begin
  select school_id into schedule_school_id
  from public.exam_schedules
  where id = new.exam_schedule_id;

  select school_id into class_school_id
  from public.classes
  where id = new.class_id;

  if schedule_school_id is null or class_school_id is null or schedule_school_id <> class_school_id then
    raise exception 'exam schedule class must be in the same school as schedule';
  end if;

  return new;
end;
$$;

drop trigger if exists assert_exam_schedule_class_school_consistency on public.exam_schedule_classes;
create trigger assert_exam_schedule_class_school_consistency
before insert or update on public.exam_schedule_classes
for each row execute function public.assert_exam_schedule_class_school_consistency();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.academic_years enable row level security;
alter table public.semesters enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.question_categories enable row level security;
alter table public.question_stimuli enable row level security;
alter table public.questions enable row level security;
alter table public.exam_packages enable row level security;
alter table public.exam_schedules enable row level security;
alter table public.exam_package_questions enable row level security;
alter table public.exam_schedule_classes enable row level security;
alter table public.exam_participants enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;
alter table public.exam_events enable row level security;
alter table public.question_options enable row level security;

drop policy if exists schools_tenant_select on public.schools;
create policy schools_tenant_select on public.schools
for select using (public.can_access_school(id));

drop policy if exists schools_super_admin_all on public.schools;
create policy schools_super_admin_all on public.schools
for all using (public.current_app_is_super_admin())
with check (public.current_app_is_super_admin());

drop policy if exists users_tenant_select on public.users;
create policy users_tenant_select on public.users
for select using (
  public.current_app_is_super_admin()
  or id = public.current_app_user_id()
  or school_id = public.current_app_school_id()
);

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

-- Optional legacy/current membership tables.
do $$
begin
  if to_regclass('public.teacher_subjects') is not null then
    execute 'alter table public.teacher_subjects enable row level security';
    execute 'drop policy if exists teacher_subjects_tenant_all on public.teacher_subjects';
    execute $policy$
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
      )
    $policy$;
  end if;

  if to_regclass('public.student_classes') is not null then
    execute 'alter table public.student_classes enable row level security';
    execute 'drop policy if exists student_classes_tenant_all on public.student_classes';
    execute $policy$
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
      )
    $policy$;
  end if;

  if to_regclass('public.class_members') is not null then
    execute 'alter table public.class_members enable row level security';
    execute 'drop policy if exists class_members_tenant_all on public.class_members';
    execute $policy$
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
      )
    $policy$;
  end if;

  if to_regclass('public.question_attachments') is not null then
    execute 'alter table public.question_attachments enable row level security';
    execute 'drop policy if exists question_attachments_tenant_all on public.question_attachments';
    execute $policy$
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
      )
    $policy$;
  end if;

  if to_regclass('public.question_versions') is not null then
    execute 'alter table public.question_versions enable row level security';
    execute 'drop policy if exists question_versions_tenant_all on public.question_versions';
    execute $policy$
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
      )
    $policy$;
  end if;
end $$;
