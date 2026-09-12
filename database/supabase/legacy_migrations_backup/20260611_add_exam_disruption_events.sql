-- Track connection and submit disruption events in the existing exam_events stream.

alter table public.exam_events
drop constraint if exists exam_events_event_type_check;

alter table public.exam_events
add constraint exam_events_event_type_check check (
  event_type in (
    'tab_blur',
    'tab_focus',
    'visibility_hidden',
    'visibility_visible',
    'copy_attempt',
    'paste_attempt',
    'fullscreen_exit',
    'before_unload',
    'offline',
    'online',
    'disconnected',
    'failed_submit'
  )
);
