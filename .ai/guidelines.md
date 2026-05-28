# AI Development Guidelines

# Project Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase SSR
- Supabase Auth
- PostgreSQL
- Server Actions

---

# Current Sprint Status

Completed:

- Sprint 1 → Authentication & Authorization
- Sprint 2 → RBAC Dashboard Foundation

Current:

- Sprint 3 → Master Data Management

Not Started Yet:

- Question Bank
- Exam Engine
- Grading
- Anti Cheat
- Analytics

---

# Core Architecture Rules

- Do not modify database schema unless explicitly requested
- Do not rename existing columns
- Do not create duplicate tables
- Use scalable enterprise architecture
- Use reusable components
- Use server-side route protection
- Use RBAC architecture everywhere

---

# Auth Rules

Supabase Auth mapping:

auth.users.id
↓
public.users.auth_user_id

Important:

- NEVER compare auth.users.id with public.users.id
- public.users.id is internal application id
- public.users.auth_user_id is Supabase Auth mapping

---

# RBAC Rules

Use:

- requireAuth()
- requireRole()
- hasPermission()

Never:

- hardcode role checks inside UI only
- trust client-side auth

Always:

- protect routes server-side
- validate permission server-side

---

# Permission Format

Format:

module.action

Examples:

- dashboard.view
- users.create
- classes.manage
- subjects.view

---

# Dashboard Rules

Dashboard routes:

- /dashboard/super-admin
- /dashboard/admin
- /dashboard/principal
- /dashboard/teacher
- /dashboard/student
- /dashboard/proctor

Rules:

- sidebar must be permission-aware
- dashboard pages must be protected
- redirect user based on role

---

# UI Rules

Use:

- responsive dashboard shell
- reusable table components
- reusable form components
- loading states
- empty states
- clean enterprise design

Avoid:

- overcomplicated UI
- duplicated components
- deeply nested layouts

---

# Database Rules

Use:

- school_id for school-related entities
- is_active for active/inactive state
- deleted_at for soft delete when available

Never:

- hard delete important relational data
- bypass RBAC checks

---

# Sprint 3 Scope

Allowed:

- schools
- academic_years
- semesters
- classes
- subjects
- teacher_subjects
- student_classes

Do Not Build Yet:

- question bank
- exam engine
- grading
- analytics
- anti cheat

---

# Coding Standards

- Use TypeScript strictly
- Prefer server components
- Use server actions for mutations
- Use zod validation
- Use clean folder structure
- Keep business logic separated
- Avoid fat components
- Prefer reusable utilities

---

# Middleware Rules

Middleware must:

- support Supabase SSR
- avoid redirect loops
- skip next-action requests
- protect dashboard routes
- handle auth safely

---

# Goal

Build enterprise-grade CBT platform foundation
with scalable RBAC architecture and clean
academic master data management.
