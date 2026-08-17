-- Minimal, normalized Quest event stream for recommendations and Trending.

create table public.quest_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on update cascade on delete restrict,
  event_type text not null,
  created_at timestamptz not null default now(),
  constraint quest_events_type_check check (event_type in ('VIEW', 'START', 'COMPLETE'))
);

create index quest_events_quest_type_created_idx
  on public.quest_events(quest_id, event_type, created_at desc);
create index quest_events_user_created_idx
  on public.quest_events(user_id, created_at desc);
create unique index quest_events_one_start_per_user_quest_idx
  on public.quest_events(user_id, quest_id)
  where event_type = 'START';
create unique index quest_events_one_complete_per_user_quest_idx
  on public.quest_events(user_id, quest_id)
  where event_type = 'COMPLETE';

alter table public.quest_events enable row level security;

create policy "Users can read own quest events"
on public.quest_events for select to authenticated
using (user_id = auth.uid());

grant select on public.quest_events to authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.quest_events from anon, authenticated;

create function public.record_quest_view(p_quest_id uuid)
returns table (event_id uuid, recorded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.quests where id = p_quest_id and status = 'PUBLISHED') then
    raise exception 'Published quest not found';
  end if;

  -- Serializes concurrent React mounts for this user/Quest pair.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_quest_id::text || ':VIEW', 0));

  select id into v_event_id
  from public.quest_events
  where user_id = v_user_id
    and quest_id = p_quest_id
    and event_type = 'VIEW'
    and created_at >= now() - interval '30 minutes'
  order by created_at desc
  limit 1;

  if v_event_id is not null then
    return query select v_event_id, false;
    return;
  end if;

  insert into public.quest_events(user_id, quest_id, event_type)
  values (v_user_id, p_quest_id, 'VIEW')
  returning id into v_event_id;

  return query select v_event_id, true;
end;
$$;

-- Keep START event and progress state in the same transaction.
create or replace function public.start_quest(p_quest_id uuid)
returns table (user_quest_id uuid, quest_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_quest_id uuid;
  v_status text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.quests where id = p_quest_id and status = 'PUBLISHED') then
    raise exception 'Published quest not found';
  end if;

  insert into public.user_quests (user_id, quest_id, status, started_at)
  values (v_user_id, p_quest_id, 'STARTED', now())
  on conflict (user_id, quest_id) do update set
    status = case
      when public.user_quests.status in ('IN_PROGRESS', 'COMPLETED') then public.user_quests.status
      else 'STARTED'
    end,
    started_at = coalesce(public.user_quests.started_at, now()),
    abandoned_at = case when public.user_quests.status = 'COMPLETED' then public.user_quests.abandoned_at else null end
  returning id, status into v_user_quest_id, v_status;

  insert into public.quest_events(user_id, quest_id, event_type)
  values (v_user_id, p_quest_id, 'START')
  on conflict do nothing;

  return query select v_user_quest_id, v_status;
end;
$$;

-- Keep PASS proof, COMPLETED progress, and COMPLETE event atomic.
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

  insert into public.user_quests (user_id, quest_id, status, started_at, completed_at)
  values (v_user_id, p_quest_id, 'COMPLETED', now(), now())
  on conflict (user_id, quest_id) do update set
    status = 'COMPLETED',
    started_at = coalesce(public.user_quests.started_at, now()),
    completed_at = coalesce(public.user_quests.completed_at, now()),
    abandoned_at = null
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

  return query select v_user_quest_id, v_proof_id, 'COMPLETED'::text, 'PASS'::text;
end;
$$;

revoke all on function public.record_quest_view(uuid) from public, anon;
grant execute on function public.record_quest_view(uuid) to authenticated;

comment on table public.quest_events is 'Normalized MVP Quest behavior stream. Quest metadata is joined from quests instead of duplicated.';
comment on function public.record_quest_view is 'Records at most one VIEW per user and Quest in a rolling 30-minute window.';
