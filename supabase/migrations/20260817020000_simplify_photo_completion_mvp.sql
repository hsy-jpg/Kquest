-- MVP completion flow: anonymous/authenticated user starts, progresses, then
-- completes immediately when a photo has been uploaded successfully.

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

  return query select v_user_quest_id, v_status;
end;
$$;

create or replace function public.mark_quest_in_progress(p_quest_id uuid)
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
  values (v_user_id, p_quest_id, 'IN_PROGRESS', now())
  on conflict (user_id, quest_id) do update set
    status = case when public.user_quests.status = 'COMPLETED' then 'COMPLETED' else 'IN_PROGRESS' end,
    started_at = coalesce(public.user_quests.started_at, now()),
    abandoned_at = case when public.user_quests.status = 'COMPLETED' then public.user_quests.abandoned_at else null end
  returning id, status into v_user_quest_id, v_status;

  return query select v_user_quest_id, v_status;
end;
$$;

drop function if exists public.submit_quest_photo(uuid, text, text, bigint, integer[]);

create function public.submit_quest_photo(
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
    where bucket_id = 'quest-proofs'
      and name = p_storage_path
      and owner_id = v_user_id::text
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

  return query select v_user_quest_id, v_proof_id, 'COMPLETED'::text, 'PASS'::text;
end;
$$;

revoke all on function public.start_quest(uuid) from public, anon;
revoke all on function public.mark_quest_in_progress(uuid) from public, anon;
revoke all on function public.submit_quest_photo(uuid, text, text, bigint) from public, anon;
grant execute on function public.start_quest(uuid) to authenticated;
grant execute on function public.mark_quest_in_progress(uuid) to authenticated;
grant execute on function public.submit_quest_photo(uuid, text, text, bigint) to authenticated;

comment on function public.start_quest is 'Idempotently records STARTED when a signed-in user enters Quest Play.';
comment on function public.mark_quest_in_progress is 'Idempotently records IN_PROGRESS when a signed-in user enters PhotoVerify.';
comment on function public.submit_quest_photo is 'MVP: uploaded photo is recorded as PASS and the Quest is completed atomically.';
comment on table public.quest_proofs is 'Photo proof audit records. MVP writes PASS immediately; PENDING/REVIEW/FAIL are reserved for future verification.';
