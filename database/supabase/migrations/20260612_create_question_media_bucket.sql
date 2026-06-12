-- Public bucket for question/stimulus media uploaded from the question bank UI.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'question-media',
  'question-media',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'application/pdf'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists question_media_public_select on storage.objects;
create policy question_media_public_select on storage.objects
for select
using (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_insert on storage.objects;
create policy question_media_authenticated_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_update on storage.objects;
create policy question_media_authenticated_update on storage.objects
for update
to authenticated
using (bucket_id = 'question-media')
with check (bucket_id = 'question-media');

drop policy if exists question_media_authenticated_delete on storage.objects;
create policy question_media_authenticated_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'question-media');
