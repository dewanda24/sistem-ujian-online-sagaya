# CBT Sekolah — Database Schema Documentation

# Project Overview

Aplikasi CBT sekolah berbasis:

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase PostgreSQL
- Supabase SSR
- RBAC (Role Based Access Control)

Current Architecture Stage:

- Sprint 1 completed → Authentication & Authorization
- Sprint 2 completed → RBAC Dashboard Foundation
- Sprint 3 in progress → Master Data Management

Current Scope:

- Single school architecture
- Multi-school ready schema design
- Enterprise RBAC foundation

---

# SPRINT 1 — Authentication & Authorization Foundation

Purpose:
Membangun authentication, authorization, RBAC, dan session foundation.

---

## public.roles

Purpose:
Menyimpan role aplikasi.

Columns:

- id uuid primary key
- name text unique
- label text
- created_at timestamptz
- updated_at timestamptz nullable

Available Roles:

- super_admin
- admin
- principal
- teacher
- student
- proctor

Business Rules:

- super_admin memiliki semua permission
- role digunakan untuk redirect dashboard
- role digunakan untuk permission guard

---

## public.permissions

Purpose:
Menyimpan daftar permission sistem.

Columns:

- id uuid primary key
- code text unique
- module text
- action text
- created_at timestamptz

Examples:

- dashboard.view
- users.view
- users.create
- users.update
- users.delete
- roles.view
- roles.manage
- audit_logs.view

Business Rules:

- Format permission:
  module.action
- Permission digunakan untuk RBAC
- Jangan hardcode permission di UI

---

## public.role_permissions

Purpose:
Pivot table role dan permission.

Columns:

- role_id uuid references public.roles.id
- permission_id uuid references public.permissions.id

Relations:

- role_permissions.role_id -> roles.id
- role_permissions.permission_id -> permissions.id

Business Rules:

- Semua permission check harus membaca tabel ini
- super_admin memiliki semua permission

---

## public.users

Purpose:
User aplikasi internal.

Columns:

- id uuid primary key
- auth_user_id uuid references auth.users.id
- role_id uuid references public.roles.id
- username text
- email text
- status text
- deleted_at timestamptz nullable
- created_at timestamptz

Relations:

- users.auth_user_id -> auth.users.id
- users.role_id -> roles.id

Business Rules:

- Login menggunakan Supabase Auth
- auth.users.id HARUS dicocokkan ke users.auth_user_id
- Jangan query users.id menggunakan auth user id
- status harus active agar dapat login dashboard

---

## public.user_profiles

Purpose:
Menyimpan data profile tambahan user.

Columns:

- user_id uuid references public.users.id
- full_name text
- nis text nullable
- nisn text nullable
- nip text nullable
- phone text nullable
- avatar_url text nullable
- created_at timestamptz

Relations:

- user_profiles.user_id -> users.id

Business Rules:

- teacher dapat menggunakan nip
- student dapat menggunakan nis / nisn
- admin/proctor dapat kosong

---

## public.audit_logs

Purpose:
Menyimpan aktivitas sistem.

Columns:

- id uuid primary key
- user_id uuid nullable
- action text
- entity_type text
- entity_id uuid nullable
- payload jsonb nullable
- ip_address text nullable
- created_at timestamptz

Business Rules:

- Digunakan untuk audit sistem
- Digunakan untuk security tracking

---

# SPRINT 2 — RBAC Dashboard Foundation

Purpose:
Membangun dashboard architecture dan permission system.

---

# Authentication Flow

Flow:

auth.users
↓
public.users.auth_user_id
↓
public.roles
↓
public.role_permissions
↓
public.permissions

---

# Current Auth Rules

- Login menggunakan Supabase Auth
- Session menggunakan Supabase SSR
- Middleware melindungi dashboard routes
- Dashboard redirect berdasarkan role
- Semua protected routes wajib server-side guard

---

# Dashboard Architecture

Dashboard routes:

- /dashboard/super-admin
- /dashboard/admin
- /dashboard/principal
- /dashboard/teacher
- /dashboard/student
- /dashboard/proctor

Business Rules:

- User hanya boleh akses dashboard sesuai role
- Permission checker wajib digunakan
- Sidebar harus dinamis berdasarkan permission

---

# Permission Rules

Examples:

super_admin:

- all permissions

admin:

- master data management

teacher:

- question bank
- exams
- grading

student:

- active exams
- exam history

principal:

- reports
- analytics

proctor:

- exam supervision

---

# SPRINT 3 — Master Data Management

Purpose:
Membangun master data akademik sekolah.

---

## public.schools

Purpose:
Menyimpan data sekolah.

Columns:

- id uuid primary key
- name text
- npsn text nullable
- address text nullable
- city text nullable
- province text nullable
- principal_name text nullable
- email text nullable
- phone text nullable
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz nullable

Business Rules:

- Saat ini hanya satu sekolah
- Tetap gunakan school_id agar siap multi-school

---

## public.academic_years

Purpose:
Menyimpan tahun ajaran.

Columns:

- id uuid primary key
- school_id uuid references public.schools.id
- name text
- start_date date nullable
- end_date date nullable
- is_active boolean default false
- created_at timestamptz
- updated_at timestamptz nullable

Examples:

- 2025/2026

Business Rules:

- Harus dapat memilih tahun ajaran aktif
- Idealnya hanya satu academic_year aktif

---

## public.semesters

Purpose:
Menyimpan semester.

Columns:

- id uuid primary key
- academic_year_id uuid references public.academic_years.id
- name text
- code text
- is_active boolean default false
- created_at timestamptz
- updated_at timestamptz nullable

Examples:

- Ganjil
- Genap

Business Rules:

- Harus dapat memilih semester aktif

---

## public.classes

Purpose:
Menyimpan daftar kelas.

Columns:

- id uuid primary key
- school_id uuid references public.schools.id
- name text
- grade_level text
- sort_order integer nullable
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz nullable

Examples:

- VII A
- VII B
- VIII A
- IX C

Business Rules:

- Saat ini belum menggunakan jurusan
- Jurusan dapat ditambahkan di sprint berikutnya

---

## public.subjects

Purpose:
Menyimpan mata pelajaran.

Columns:

- id uuid primary key
- school_id uuid references public.schools.id
- name text
- code text nullable
- is_active boolean default true
- created_at timestamptz
- updated_at timestamptz nullable

Examples:

- Matematika
- Bahasa Indonesia
- Bahasa Inggris
- IPA
- IPS

---

## public.teacher_subjects

Purpose:
Relasi guru dengan mapel dan kelas.

Columns:

- id uuid primary key
- teacher_id uuid references public.users.id
- subject_id uuid references public.subjects.id
- class_id uuid references public.classes.id
- academic_year_id uuid references public.academic_years.id
- created_at timestamptz

Business Rules:

- teacher_id harus role teacher
- Guru dapat mengajar banyak kelas/mapel

---

## public.student_classes

Purpose:
Relasi siswa dengan kelas.

Columns:

- id uuid primary key
- student_id uuid references public.users.id
- class_id uuid references public.classes.id
- academic_year_id uuid references public.academic_years.id
- created_at timestamptz

Business Rules:

- student_id harus role student
- Satu siswa aktif di satu kelas per academic_year

---

# Sprint 3 Permissions

Required Permissions:

- master_data.view
- schools.view
- schools.manage
- academic_years.view
- academic_years.manage
- semesters.view
- semesters.manage
- classes.view
- classes.manage
- subjects.view
- subjects.manage
- teachers.view
- teachers.manage
- students.view
- students.manage

---

# Architecture Rules

- Gunakan Supabase SSR
- Gunakan App Router
- Gunakan RBAC
- Jangan hardcode permission
- Semua protected routes wajib server-side guard
- Semua dashboard UI wajib permission-aware
- Gunakan public.users.id untuk relasi internal
- Gunakan auth_user_id hanya untuk auth mapping
- Gunakan soft delete bila tersedia deleted_at
- Gunakan is_active untuk master data
