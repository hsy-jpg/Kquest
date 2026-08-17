-- Profile page backing data: real profiles, wardrobe, journal, friends,
-- groups, and XP/streak tracking. Additive only; existing tables are
-- extended, never rewritten. Every statement is safe to re-run (uses
-- if-not-exists / drop-then-create / create-or-replace throughout), since
-- partial runs of earlier versions of this file may already have applied
-- some of it.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user (anonymous or real), created automatically.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Traveler',
  country_flag text not null default '🌍',
  equipped_items jsonb not null default '{}'::jsonb,
  current_streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_equipped_items_object_check check (jsonb_typeof(equipped_items) = 'object')
);

comment on table public.profiles is 'One row per auth user. Created automatically by handle_new_user on signup (incl. anonymous).';
comment on column public.profiles.equipped_items is 'Map of wardrobe slot -> item_id, mirrors src/data/items.ts ItemSlot keys.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles for any users created before this migration.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;

drop policy if exists "Any authenticated user can read profiles" on public.profiles;
create policy "Any authenticated user can read profiles"
on public.profiles for select to authenticated
using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, update on public.profiles to authenticated;
revoke insert, delete, truncate, references, trigger on public.profiles from anon, authenticated;

-- ---------------------------------------------------------------------------
-- user_items: unlocked wardrobe items, replaces kquest.wardrobe.unlocked.
-- ---------------------------------------------------------------------------

create table if not exists public.user_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

comment on table public.user_items is 'Unlocked wardrobe item ids per user. Item catalog (slot, emoji, etc.) lives in src/data/items.ts.';

alter table public.user_items enable row level security;

drop policy if exists "Users manage their own wardrobe unlocks" on public.user_items;
create policy "Users manage their own wardrobe unlocks"
on public.user_items for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_items to authenticated;
revoke all on public.user_items from anon;

-- ---------------------------------------------------------------------------
-- journal_entries + journal_likes + journal_comments: public feed.
-- ---------------------------------------------------------------------------

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid references public.quests(id) on delete set null,
  content text not null,
  photo_path text,
  created_at timestamptz not null default now(),

  constraint journal_entries_content_length_check check (char_length(content) between 1 and 2000)
);

create index if not exists journal_entries_created_idx on public.journal_entries(created_at desc);
create index if not exists journal_entries_user_created_idx on public.journal_entries(user_id, created_at desc);

comment on table public.journal_entries is 'User travel journal posts. Readable by all authenticated users (public feed); writable only by the owner.';

create table if not exists public.journal_likes (
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

alter table public.journal_entries enable row level security;
alter table public.journal_likes enable row level security;

drop policy if exists "Any authenticated user can read journal entries" on public.journal_entries;
create policy "Any authenticated user can read journal entries"
on public.journal_entries for select to authenticated
using (true);

drop policy if exists "Users can write their own journal entries" on public.journal_entries;
create policy "Users can write their own journal entries"
on public.journal_entries for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can edit their own journal entries" on public.journal_entries;
create policy "Users can edit their own journal entries"
on public.journal_entries for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own journal entries" on public.journal_entries;
create policy "Users can delete their own journal entries"
on public.journal_entries for delete to authenticated
using (auth.uid() = user_id);

drop policy if exists "Any authenticated user can read journal likes" on public.journal_likes;
create policy "Any authenticated user can read journal likes"
on public.journal_likes for select to authenticated
using (true);

drop policy if exists "Users can like or unlike as themselves" on public.journal_likes;
create policy "Users can like or unlike as themselves"
on public.journal_likes for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on public.journal_entries to authenticated;
grant select, insert, delete on public.journal_likes to authenticated;
revoke all on public.journal_entries, public.journal_likes from anon;

create table if not exists public.journal_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),

  constraint journal_comments_content_length_check check (char_length(content) between 1 and 500)
);

create index if not exists journal_comments_entry_created_idx on public.journal_comments(entry_id, created_at);

alter table public.journal_comments enable row level security;

drop policy if exists "Any authenticated user can read journal comments" on public.journal_comments;
create policy "Any authenticated user can read journal comments"
on public.journal_comments for select to authenticated
using (true);

drop policy if exists "Users can write their own journal comments" on public.journal_comments;
create policy "Users can write their own journal comments"
on public.journal_comments for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own journal comments" on public.journal_comments;
create policy "Users can delete their own journal comments"
on public.journal_comments for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.journal_comments to authenticated;
revoke all on public.journal_comments from anon;

create or replace view public.journal_entries_with_counts as
select
  je.*,
  (select count(*) from public.journal_likes jl where jl.entry_id = je.id) as like_count,
  (select count(*) from public.journal_comments jc where jc.entry_id = je.id) as comment_count
from public.journal_entries je;

grant select on public.journal_entries_with_counts to authenticated;

-- journal-photos bucket: public read, unlike the private quest-proofs bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('journal-photos', 'journal-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view journal photos" on storage.objects;
create policy "Anyone can view journal photos"
on storage.objects for select to authenticated, anon
using (bucket_id = 'journal-photos');

drop policy if exists "Users can upload their own journal photos" on storage.objects;
create policy "Users can upload their own journal photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'journal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own journal photos" on storage.objects;
create policy "Users can delete their own journal photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'journal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- groups, group_members, group_messages: joinable rooms with member-only chat.
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  emoji text not null default '🌍',
  created_at timestamptz not null default now()
);

insert into public.groups (id, name, description, emoji) values
  ('11111111-1111-1111-1111-111111111111', 'Seoul Foodies', 'Share the best street food spots and hidden restaurants in Seoul', '🍜'),
  ('22222222-2222-2222-2222-222222222222', 'K-Culture Crew', 'Noraebang nights, K-drama locations, and pop-up events', '🎤'),
  ('33333333-3333-3333-3333-333333333333', 'Budget Explorers', 'Explore Seoul on a budget — thrift shops, free attractions, cheap eats', '🧳'),
  ('44444444-4444-4444-4444-444444444444', 'Night Owls Seoul', 'Late-night ramen runs, convenience store hacks, and after-hours vibes', '🌙'),
  ('55555555-5555-5555-5555-555555555555', 'Hiking & Nature', 'Mountain trails, hidden parks, and sunrise viewpoints around Seoul', '⛰️')
on conflict (id) do nothing;

alter table public.groups enable row level security;

drop policy if exists "Any authenticated user can read groups" on public.groups;
create policy "Any authenticated user can read groups"
on public.groups for select to authenticated
using (true);

grant select on public.groups to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.groups from anon, authenticated;

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

drop policy if exists "Any authenticated user can read group membership" on public.group_members;
create policy "Any authenticated user can read group membership"
on public.group_members for select to authenticated
using (true);

drop policy if exists "Users can join groups as themselves" on public.group_members;
create policy "Users can join groups as themselves"
on public.group_members for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can leave groups they joined" on public.group_members;
create policy "Users can leave groups they joined"
on public.group_members for delete to authenticated
using (auth.uid() = user_id);

grant select, insert, delete on public.group_members to authenticated;
revoke all on public.group_members from anon;

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),

  constraint group_messages_content_length_check check (char_length(content) between 1 and 1000)
);

create index if not exists group_messages_group_created_idx on public.group_messages(group_id, created_at);

alter table public.group_messages enable row level security;

drop policy if exists "Group members can read messages in their groups" on public.group_messages;
create policy "Group members can read messages in their groups"
on public.group_messages for select to authenticated
using (exists (
  select 1 from public.group_members gm
  where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()
));

drop policy if exists "Group members can send messages in their groups" on public.group_messages;
create policy "Group members can send messages in their groups"
on public.group_messages for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.group_members gm
    where gm.group_id = group_messages.group_id and gm.user_id = auth.uid()
  )
);

grant select, insert on public.group_messages to authenticated;
revoke all on public.group_messages from anon;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end;
$$;

comment on table public.group_messages is 'Member-only group chat. Realtime-enabled so new messages push live to open chats.';

-- ---------------------------------------------------------------------------
-- friendships: simple mutual add/remove, no request/accept flow.
-- ---------------------------------------------------------------------------

create table if not exists public.friendships (
  user_id_a uuid not null references auth.users(id) on delete cascade,
  user_id_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id_a, user_id_b),
  constraint friendships_ordered_pair_check check (user_id_a < user_id_b)
);

comment on table public.friendships is 'Symmetric mutual-add friendships. Always stored with the smaller uuid as user_id_a.';

alter table public.friendships enable row level security;

drop policy if exists "Users can read friendships they are part of" on public.friendships;
create policy "Users can read friendships they are part of"
on public.friendships for select to authenticated
using (auth.uid() = user_id_a or auth.uid() = user_id_b);

grant select on public.friendships to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.friendships from anon, authenticated;

create or replace function public.toggle_friend(p_other_user_id uuid)
returns table (is_friend boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_deleted boolean;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_other_user_id = v_user_id then raise exception 'Cannot friend yourself'; end if;
  if not exists (select 1 from auth.users where id = p_other_user_id) then
    raise exception 'User not found';
  end if;

  v_a := least(v_user_id, p_other_user_id);
  v_b := greatest(v_user_id, p_other_user_id);

  delete from public.friendships where user_id_a = v_a and user_id_b = v_b;
  get diagnostics v_deleted = row_count;

  if v_deleted then
    return query select false;
  else
    insert into public.friendships (user_id_a, user_id_b) values (v_a, v_b);
    return query select true;
  end if;
end;
$$;

revoke all on function public.toggle_friend(uuid) from public, anon;
grant execute on function public.toggle_friend(uuid) to authenticated;

comment on function public.toggle_friend is 'Adds a mutual friendship if none exists, otherwise removes it.';

-- ---------------------------------------------------------------------------
-- XP + streak: extend submit_quest_photo (create or replace, same signature).
-- ---------------------------------------------------------------------------

alter table public.user_quests
  add column if not exists xp_awarded integer not null default 0;

-- user_quests RLS is owner-only, so a public leaderboard needs an aggregate
-- view: it exposes a per-user XP total and quest count (already visible via
-- each user's own public profile card) without exposing anyone's individual
-- quest rows.
create or replace view public.public_xp_totals as
select
  user_id,
  coalesce(sum(xp_awarded), 0)::integer as total_xp,
  count(*)::integer as completed_quest_count
from public.user_quests
where status = 'COMPLETED'
group by user_id;

grant select on public.public_xp_totals to authenticated;

create or replace function public.bump_streak(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last date;
begin
  select last_active_date into v_last from public.profiles where user_id = p_user_id;

  update public.profiles
  set
    current_streak = case
      when v_last is null or v_last < current_date - interval '1 day' then 1
      when v_last = current_date - interval '1 day' then current_streak + 1
      else current_streak
    end,
    last_active_date = current_date
  where user_id = p_user_id;
end;
$$;

revoke all on function public.bump_streak(uuid) from public, anon, authenticated;

create or replace function public.submit_quest_photo(
  p_quest_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint
)
returns table (
  user_quest_id uuid,
  proof_id uuid,
  quest_status text,
  proof_status text
)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  v_user_id uuid := auth.uid();
  v_quest public.quests%rowtype;
  v_user_quest_id uuid;
  v_proof_id uuid;
  v_local_score smallint;
  v_xp integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_quest from public.quests
  where id = p_quest_id and status = 'PUBLISHED';
  if not found then raise exception 'Published quest not found'; end if;
  if v_quest.proof_type <> 'PHOTO' then raise exception 'Quest does not accept photo proof'; end if;
  if p_storage_path not like v_user_id::text || '/%' then raise exception 'Invalid proof storage path'; end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then raise exception 'Unsupported image type'; end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Invalid image size'; end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'quest-proofs' and name = p_storage_path and owner_id = v_user_id::text
  ) then raise exception 'Uploaded proof object not found'; end if;

  select local_score into v_local_score
  from public.tour_places
  where source_content_id = v_quest.source_content_id;

  -- Same formula as adaptPublishedQuest() in src/features/quests/supabaseQuestAdapter.ts.
  v_xp := round((80 + coalesce(v_local_score, 70) * 0.7) / 10) * 10;

  insert into public.user_quests (user_id, quest_id, status, started_at, completed_at, xp_awarded)
  values (v_user_id, p_quest_id, 'COMPLETED', now(), now(), v_xp)
  on conflict (user_id, quest_id) do update set
    status = 'COMPLETED',
    started_at = coalesce(public.user_quests.started_at, now()),
    completed_at = coalesce(public.user_quests.completed_at, now()),
    abandoned_at = null,
    xp_awarded = case when public.user_quests.status = 'COMPLETED' then public.user_quests.xp_awarded else v_xp end
  returning id into v_user_quest_id;

  insert into public.quest_proofs (
    user_quest_id, user_id, quest_id, proof_type, proof_status,
    storage_path, mime_type, size_bytes,
    proof_requirement_snapshot, completion_rule_snapshot,
    reviewed_at, review_notes
  ) values (
    v_user_quest_id, v_user_id, p_quest_id, 'PHOTO', 'PASS',
    p_storage_path, p_mime_type, p_size_bytes,
    v_quest.proof_requirement, v_quest.completion_rule,
    now(), 'MVP: upload success automatically passes photo proof.'
  ) returning id into v_proof_id;

  insert into public.quest_events(user_id, quest_id, event_type)
  values (v_user_id, p_quest_id, 'COMPLETE')
  on conflict do nothing;

  perform public.bump_streak(v_user_id);

  return query select v_user_quest_id, v_proof_id, 'COMPLETED'::text, 'PASS'::text;
end;
$$;

revoke all on function public.submit_quest_photo(uuid, text, text, bigint) from public, anon;
grant execute on function public.submit_quest_photo(uuid, text, text, bigint) to authenticated;

comment on function public.submit_quest_photo is 'MVP: uploaded photo is recorded as PASS, the Quest is completed, XP is awarded, and the daily streak is bumped, all atomically.';
