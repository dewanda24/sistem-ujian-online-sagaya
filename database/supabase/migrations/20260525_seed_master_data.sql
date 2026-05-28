-- =====================================================
-- SEED SCHOOL
-- =====================================================

insert into public.schools (
  name,
  npsn,
  address,
  city,
  province,
  principal_name,
  email,
  phone
)
values (
  'Nama Sekolah',
  '00000000',
  'Alamat Sekolah',
  'Kota',
  'Jawa Barat',
  'Nama Kepala Sekolah',
  'sekolah@example.com',
  '08123456789'
);

-- =====================================================
-- SEED ACADEMIC YEAR
-- =====================================================

insert into public.academic_years (
  school_id,
  name,
  is_active
)
select
  id,
  '2025/2026',
  true
from public.schools
limit 1;

-- =====================================================
-- SEED SEMESTERS
-- =====================================================

insert into public.semesters (
  academic_year_id,
  name,
  code,
  is_active
)
select
  id,
  'Ganjil',
  'odd',
  true
from public.academic_years
where name = '2025/2026';

insert into public.semesters (
  academic_year_id,
  name,
  code,
  is_active
)
select
  id,
  'Genap',
  'even',
  false
from public.academic_years
where name = '2025/2026';

-- =====================================================
-- SEED CLASSES
-- =====================================================

insert into public.classes (
  school_id,
  name,
  grade_level,
  sort_order
)
select
  s.id,
  c.name,
  c.grade_level,
  c.sort_order
from public.schools s
cross join (
  values
    ('VII A', 'VII', 1),
    ('VII B', 'VII', 2),
    ('VIII A', 'VIII', 3),
    ('VIII B', 'VIII', 4),
    ('IX A', 'IX', 5),
    ('IX B', 'IX', 6)
) as c(name, grade_level, sort_order);

-- =====================================================
-- SEED SUBJECTS
-- =====================================================

insert into public.subjects (
  school_id,
  name,
  code
)
select
  s.id,
  m.name,
  m.code
from public.schools s
cross join (
  values
    ('Matematika', 'MTK'),
    ('Bahasa Indonesia', 'BIND'),
    ('Bahasa Inggris', 'BING'),
    ('IPA', 'IPA'),
    ('IPS', 'IPS'),
    ('PPKn', 'PKN'),
    ('PAI', 'PAI'),
    ('PJOK', 'PJOK'),
    ('Seni Budaya', 'SBK'),
    ('Informatika', 'INF')
) as m(name, code);