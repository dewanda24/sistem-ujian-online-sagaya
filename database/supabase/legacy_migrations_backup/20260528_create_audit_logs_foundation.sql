-- Sprint: Audit Logs Foundation
-- Scope: generic audit event storage and view permission.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  payload jsonb null,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

alter table public.audit_logs
add column if not exists user_id uuid references public.users(id) on delete set null;

alter table public.audit_logs
add column if not exists action text;

alter table public.audit_logs
add column if not exists entity_type text;

alter table public.audit_logs
add column if not exists entity_id uuid null;

alter table public.audit_logs
add column if not exists payload jsonb null;

alter table public.audit_logs
add column if not exists ip_address text null;

alter table public.audit_logs
add column if not exists user_agent text null;

alter table public.audit_logs
add column if not exists created_at timestamptz not null default now();

update public.audit_logs
set entity_type = coalesce(entity_type, 'legacy')
where entity_type is null;

update public.audit_logs
set action = coalesce(action, 'legacy.unknown')
where action is null;

alter table public.audit_logs
alter column action set not null;

alter table public.audit_logs
alter column entity_type set not null;

create index if not exists idx_audit_logs_user_id
on public.audit_logs(user_id);

create index if not exists idx_audit_logs_action
on public.audit_logs(action);

create index if not exists idx_audit_logs_entity
on public.audit_logs(entity_type, entity_id);

create index if not exists idx_audit_logs_created_at
on public.audit_logs(created_at desc);

insert into public.permissions (code, module, action)
values
  ('audit_logs.view', 'audit_logs', 'view')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'super_admin'
and p.code = 'audit_logs.view'
on conflict do nothing;
