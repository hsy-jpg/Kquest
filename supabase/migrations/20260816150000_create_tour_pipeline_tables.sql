-- K-Quest TourAPI persistence schema.
-- Additive migration only: it does not delete or rewrite existing application data.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tour_places (
  id uuid primary key default gen_random_uuid(),
  source_provider text not null default 'KTO_ENG_SERVICE_2',
  source_content_id text not null,
  title text not null,
  description text,
  region text not null,
  district text,
  latitude double precision,
  longitude double precision,
  image text,
  content_type text not null,
  source_modified_time timestamptz,
  local_score smallint not null,
  quality_score smallint not null,
  selection_status text not null,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tour_places_source_content_id_key unique (source_content_id),
  constraint tour_places_local_score_check check (local_score between 0 and 100),
  constraint tour_places_quality_score_check check (quality_score between 0 and 100),
  constraint tour_places_selection_status_check check (
    selection_status in ('AUTO_ACCEPTED', 'REVIEW', 'EXCLUDED', 'ARCHIVED')
  ),
  constraint tour_places_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint tour_places_longitude_check check (longitude is null or longitude between -180 and 180)
);

comment on table public.tour_places is 'Normalized Korea Tourism Organization source content and selection result.';
comment on column public.tour_places.source_content_id is 'Stable KTO contentid used as the pipeline upsert key.';
comment on column public.tour_places.source_modified_time is 'KTO modifiedtime normalized to timestamptz for change detection.';

create index tour_places_status_region_score_idx
  on public.tour_places (selection_status, region, local_score desc);
create index tour_places_region_district_idx
  on public.tour_places (region, district);
create index tour_places_source_modified_time_idx
  on public.tour_places (source_modified_time desc);
create index tour_places_coordinates_idx
  on public.tour_places (latitude, longitude)
  where latitude is not null and longitude is not null;

create trigger tour_places_set_updated_at
before update on public.tour_places
for each row execute function public.set_updated_at();

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  quest_id text not null,
  source_content_id text not null,
  title text not null,
  description text,
  quest_type text not null,
  secondary_tags text[] not null default '{}'::text[],
  template_id text not null,
  steps jsonb not null default '[]'::jsonb,
  classification_confidence numeric(4, 3) not null,
  region text not null,
  district text,
  latitude double precision,
  longitude double precision,
  image text,
  status text not null default 'DRAFT',
  source_modified_time timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quests_quest_id_key unique (quest_id),
  constraint quests_source_content_id_key unique (source_content_id),
  constraint quests_source_content_id_fkey foreign key (source_content_id)
    references public.tour_places (source_content_id)
    on update cascade on delete restrict,
  constraint quests_steps_array_check check (jsonb_typeof(steps) = 'array'),
  constraint quests_confidence_check check (
    classification_confidence between 0 and 1
  ),
  constraint quests_status_check check (
    status in ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED')
  ),
  constraint quests_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint quests_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint quests_publish_time_check check (
    status <> 'PUBLISHED' or published_at is not null
  )
);

comment on table public.quests is 'Generated K-Quest content. One active pipeline quest per KTO source content item.';
comment on column public.quests.secondary_tags is 'Filterable tags stored as a Postgres text array.';
comment on column public.quests.steps is 'Ordered Quest step objects stored as a JSONB array.';

create index quests_status_region_idx
  on public.quests (status, region, district);
create index quests_status_type_idx
  on public.quests (status, quest_type);
create index quests_source_modified_time_idx
  on public.quests (source_modified_time desc);
create index quests_secondary_tags_gin_idx
  on public.quests using gin (secondary_tags);

create trigger quests_set_updated_at
before update on public.quests
for each row execute function public.set_updated_at();

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  source_content_id text not null,
  proposed_quest_type text,
  proposed_template_id text,
  local_score smallint not null,
  quality_score smallint not null,
  review_reasons text[] not null default '{}'::text[],
  raw_data jsonb not null default '{}'::jsonb,
  detail_data jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING',
  source_modified_time timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint review_items_source_content_id_key unique (source_content_id),
  constraint review_items_source_content_id_fkey foreign key (source_content_id)
    references public.tour_places (source_content_id)
    on update cascade on delete restrict,
  constraint review_items_local_score_check check (local_score between 0 and 100),
  constraint review_items_quality_score_check check (quality_score between 0 and 100),
  constraint review_items_raw_data_object_check check (jsonb_typeof(raw_data) = 'object'),
  constraint review_items_detail_data_object_check check (jsonb_typeof(detail_data) = 'object'),
  constraint review_items_status_check check (
    status in ('PENDING', 'APPROVED', 'REJECTED', 'RESOLVED')
  )
);

comment on table public.review_items is 'Pipeline items requiring manual review; unavailable to public clients under MVP RLS.';

create index review_items_status_updated_idx
  on public.review_items (status, updated_at desc);
create index review_items_review_reasons_gin_idx
  on public.review_items using gin (review_reasons);
create index review_items_source_modified_time_idx
  on public.review_items (source_modified_time desc);

create trigger review_items_set_updated_at
before update on public.review_items
for each row execute function public.set_updated_at();

alter table public.tour_places enable row level security;
alter table public.quests enable row level security;
alter table public.review_items enable row level security;

-- MVP clients may only read content that is already safe to expose.
create policy "Public can read accepted tour places"
on public.tour_places
for select
to anon, authenticated
using (selection_status = 'AUTO_ACCEPTED');

create policy "Public can read published quests"
on public.quests
for select
to anon, authenticated
using (status = 'PUBLISHED');

-- No anon/authenticated policy is created for review_items.
-- Pipeline imports and reviewer tooling must use a trusted server/service-role context.

revoke insert, update, delete, truncate, references, trigger
  on public.tour_places, public.quests, public.review_items
  from anon, authenticated;

grant select on public.tour_places, public.quests to anon, authenticated;
revoke all on public.review_items from anon, authenticated;
