-- Migration: 20260906_add_teacher_note_and_kkm.sql
-- Description: Add teacher_note to exam_answers and kkm to subjects

-- 1. Tambah kolom teacher_note di exam_answers untuk feedback guru saat koreksi esai
alter table public.exam_answers
add column if not exists teacher_note text;

-- 2. Tambah kolom kkm di subjects dengan default 75 (rentang 0-100)
alter table public.subjects
add column if not exists kkm integer not null default 75 check (kkm >= 0 and kkm <= 100);
