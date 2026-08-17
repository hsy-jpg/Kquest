-- 20260817053000_allow_photo_completion_for_every_quest.sql (merged from main)
-- re-defined submit_quest_photo to drop the proof_type restriction, but its
-- version predates 20260817050000_add_profile_social_features.sql's
-- xp_awarded/bump_streak additions. Since migrations apply in filename
-- order, that would leave the final submit_quest_photo without XP or streak
-- tracking. This re-combines both fixes: any published quest completes via
-- photo upload, AND XP/streak are recorded.

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
    now(), 'MVP: any supported image upload automatically passes every published Quest.'
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

comment on function public.submit_quest_photo is 'Any published Quest completes via photo upload; XP is computed server-side and the daily streak is bumped, all atomically.';
