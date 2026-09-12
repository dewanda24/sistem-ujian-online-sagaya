-- Migration: 20260906_add_school_maintenance_mode.sql
-- Description: Add is_maintenance flag and maintenance_message to schools table for Super Admin isolation control

alter table public.schools
  add column if not exists is_maintenance boolean not null default false,
  add column if not exists maintenance_message text;
