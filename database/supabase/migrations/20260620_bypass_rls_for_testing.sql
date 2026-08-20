-- Bypass RLS untuk UAT / Testing
-- Mematikan sementara pengecekan ketat saat membuat jadwal ujian

begin;

drop policy if exists exam_schedules_insert_manager_v2 on public.exam_schedules;
create policy exam_schedules_insert_manager_v2 on public.exam_schedules
for insert with check (true);

drop policy if exists exam_schedule_classes_insert_manager_v2 on public.exam_schedule_classes;
create policy exam_schedule_classes_insert_manager_v2 on public.exam_schedule_classes
for insert with check (true);

commit;
