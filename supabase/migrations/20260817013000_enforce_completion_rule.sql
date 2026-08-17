-- Enforce the persisted completion_rule before marking a Quest complete.

drop function if exists public.submit_quest_photo(uuid, text, text, bigint);

create function public.submit_quest_photo(
  p_quest_id uuid,
  p_storage_path text,
  p_mime_type text,
  p_size_bytes bigint,
  p_completed_step_orders integer[]
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
  v_required_orders integer[];
  v_minimum_steps integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_quest
  from public.quests
  where id = p_quest_id and status = 'PUBLISHED';

  if not found then raise exception 'Published quest not found'; end if;
  if v_quest.proof_type <> 'PHOTO' then raise exception 'Quest does not accept photo proof'; end if;
  if p_storage_path not like v_user_id::text || '/%' then raise exception 'Invalid proof storage path'; end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then raise exception 'Unsupported image type'; end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Invalid image size'; end if;

  select coalesce(array_agg(value::integer), '{}'::integer[])
  into v_required_orders
  from jsonb_array_elements_text(coalesce(v_quest.completion_rule->'requiredStepOrders', '[]'::jsonb));

  v_minimum_steps := coalesce((v_quest.completion_rule->>'minimumCompletedSteps')::integer, 0);
  if cardinality(coalesce(p_completed_step_orders, '{}'::integer[])) < v_minimum_steps then
    raise exception 'Minimum completed steps not satisfied';
  end if;

  if exists (
    select 1 from unnest(v_required_orders) required_order
    where not (required_order = any(coalesce(p_completed_step_orders, '{}'::integer[])))
  ) then
    raise exception 'Required Quest steps not completed';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'quest-proofs' and name = p_storage_path and owner_id = v_user_id::text
  ) then
    raise exception 'Uploaded proof object not found';
  end if;

  insert into public.user_quests (user_id, quest_id, status, started_at, completed_at)
  values (v_user_id, p_quest_id, 'COMPLETED', now(), now())
  on conflict (user_id, quest_id) do update set
    status = 'COMPLETED',
    started_at = coalesce(public.user_quests.started_at, now()),
    completed_at = now(),
    abandoned_at = null
  returning id into v_user_quest_id;

  insert into public.quest_proofs (
    user_quest_id, user_id, quest_id, proof_type, proof_status,
    storage_path, mime_type, size_bytes,
    proof_requirement_snapshot, completion_rule_snapshot
  ) values (
    v_user_quest_id, v_user_id, p_quest_id, v_quest.proof_type, 'PENDING',
    p_storage_path, p_mime_type, p_size_bytes,
    v_quest.proof_requirement, v_quest.completion_rule
  ) returning id into v_proof_id;

  return query select v_user_quest_id, v_proof_id, 'COMPLETED'::text, 'PENDING'::text;
end;
$$;

revoke all on function public.submit_quest_photo(uuid, text, text, bigint, integer[]) from public, anon;
grant execute on function public.submit_quest_photo(uuid, text, text, bigint, integer[]) to authenticated;
