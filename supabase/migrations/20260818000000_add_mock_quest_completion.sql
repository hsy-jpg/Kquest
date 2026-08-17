-- The 23 hardcoded demo quests in src/data/quests.ts are what most users
-- actually browse and complete (Quests.tsx and Explore.tsx never surface the
-- TourAPI-sourced public.quests rows at all), but PhotoVerify only calls
-- submit_quest_photo when a matching public.quests row exists. For anyone
-- playing a demo quest, that lookup fails, so nothing was ever recorded:
-- Profile's Quests/Photos/XP never moved and Quest Review never persisted.
--
-- Rather than force-fitting demo quest content into the TourAPI pipeline
-- tables (which would also silently replace their curated story/steps with
-- generic DB-adapted text, since `publishedQuest ?? mockQuest` prefers the
-- DB version), this adds a small parallel path for demo-quest completions,
-- proofs, and reviews. All idempotent / safe to re-run.

create table if not exists public.mock_quest_catalog (
  id integer primary key,
  xp integer not null,
  category text not null
);

insert into public.mock_quest_catalog (id, xp, category) values
  (0, 150, 'Food'), (1, 100, 'Food'), (2, 130, 'Shopping'), (3, 110, 'Nightlife'),
  (4, 120, 'Culture'), (5, 140, 'Culture'), (6, 120, 'Culture'), (7, 90, 'Culture'),
  (8, 100, 'Nature'), (9, 90, 'Food'), (10, 90, 'Food'), (11, 170, 'Nightlife'),
  (12, 130, 'Culture'), (13, 160, 'Festival'), (14, 150, 'Festival'), (15, 170, 'Festival'),
  (16, 130, 'Nature'), (17, 140, 'Culture'), (18, 200, 'Nature'), (19, 100, 'Culture'),
  (20, 90, 'Food'), (21, 110, 'Culture'), (22, 100, 'Food')
on conflict (id) do update set xp = excluded.xp, category = excluded.category;

comment on table public.mock_quest_catalog is 'XP/category for the 23 demo quests in src/data/quests.ts, kept server-side so complete_mock_quest never trusts client-supplied XP.';

alter table public.mock_quest_catalog enable row level security;

drop policy if exists "Any authenticated user can read the mock quest catalog" on public.mock_quest_catalog;
create policy "Any authenticated user can read the mock quest catalog"
on public.mock_quest_catalog for select to authenticated
using (true);

grant select on public.mock_quest_catalog to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.mock_quest_catalog from anon, authenticated;

create table if not exists public.mock_quest_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_quest_id integer not null references public.mock_quest_catalog(id),
  xp_awarded integer not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mock_quest_id)
);

alter table public.mock_quest_completions enable row level security;

drop policy if exists "Users can read their own mock quest completions" on public.mock_quest_completions;
create policy "Users can read their own mock quest completions"
on public.mock_quest_completions for select to authenticated
using (auth.uid() = user_id);

grant select on public.mock_quest_completions to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.mock_quest_completions from anon, authenticated;

create table if not exists public.mock_quest_proofs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mock_quest_id integer not null references public.mock_quest_catalog(id),
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  submitted_at timestamptz not null default now()
);

alter table public.mock_quest_proofs enable row level security;

drop policy if exists "Users can read their own mock quest proofs" on public.mock_quest_proofs;
create policy "Users can read their own mock quest proofs"
on public.mock_quest_proofs for select to authenticated
using (auth.uid() = user_id);

grant select on public.mock_quest_proofs to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.mock_quest_proofs from anon, authenticated;

create or replace function public.complete_mock_quest(
  p_mock_quest_id integer,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint
)
returns table (mock_quest_id integer, xp_awarded integer)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select xp into v_xp from public.mock_quest_catalog where id = p_mock_quest_id;
  if not found then raise exception 'Unknown demo quest'; end if;

  if p_storage_path not like v_user_id::text || '/%' then raise exception 'Invalid proof storage path'; end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then raise exception 'Unsupported image type'; end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Invalid image size'; end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'quest-proofs' and name = p_storage_path and owner_id = v_user_id::text
  ) then raise exception 'Uploaded proof object not found'; end if;

  insert into public.mock_quest_proofs (user_id, mock_quest_id, storage_path, mime_type, size_bytes)
  values (v_user_id, p_mock_quest_id, p_storage_path, p_mime_type, p_size_bytes);

  insert into public.mock_quest_completions (user_id, mock_quest_id, xp_awarded)
  values (v_user_id, p_mock_quest_id, v_xp)
  on conflict (user_id, mock_quest_id) do nothing;

  perform public.bump_streak(v_user_id);

  return query select p_mock_quest_id, v_xp;
end;
$$;

revoke all on function public.complete_mock_quest(integer, text, text, bigint) from public, anon;
grant execute on function public.complete_mock_quest(integer, text, text, bigint) to authenticated;

comment on function public.complete_mock_quest is 'Records a demo-quest completion + photo proof. XP comes from mock_quest_catalog, never the client.';

-- ---------------------------------------------------------------------------
-- quest_reviews: covers both real (quest_id) and demo (mock_quest_id) quests.
-- ---------------------------------------------------------------------------

create table if not exists public.quest_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete cascade,
  mock_quest_id integer references public.mock_quest_catalog(id),
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(review_text) between 1 and 1000),
  created_at timestamptz not null default now(),

  constraint quest_reviews_single_target_check check (
    (quest_id is not null)::integer + (mock_quest_id is not null)::integer = 1
  )
);

create index if not exists quest_reviews_quest_created_idx on public.quest_reviews(quest_id, created_at desc);
create index if not exists quest_reviews_mock_quest_created_idx on public.quest_reviews(mock_quest_id, created_at desc);

alter table public.quest_reviews enable row level security;

drop policy if exists "Any authenticated user can read quest reviews" on public.quest_reviews;
create policy "Any authenticated user can read quest reviews"
on public.quest_reviews for select to authenticated
using (true);

drop policy if exists "Users can write their own quest reviews" on public.quest_reviews;
create policy "Users can write their own quest reviews"
on public.quest_reviews for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own quest reviews" on public.quest_reviews;
create policy "Users can delete their own quest reviews"
on public.quest_reviews for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.quest_reviews to authenticated;
revoke all on public.quest_reviews from anon;

comment on table public.quest_reviews is 'Star rating + text review for either a real (quest_id) or demo (mock_quest_id) quest.';
