-- Preserve normalized KTO detail fields for published Quest experiences.
alter table public.tour_places
  add column if not exists detail_data jsonb not null default '{}'::jsonb;

alter table public.tour_places
  drop constraint if exists tour_places_detail_data_object_check;

alter table public.tour_places
  add constraint tour_places_detail_data_object_check
  check (jsonb_typeof(detail_data) = 'object');

comment on column public.tour_places.detail_data is
  'Normalized TourAPI operating, event, experience, contact, address and detailInfo fields used by Quest Detail.';
