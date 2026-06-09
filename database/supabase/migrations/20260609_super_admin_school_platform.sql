alter table public.schools
  add column if not exists education_level text;

create unique index if not exists schools_npsn_unique_not_blank
  on public.schools (npsn)
  where npsn is not null and npsn <> '';
