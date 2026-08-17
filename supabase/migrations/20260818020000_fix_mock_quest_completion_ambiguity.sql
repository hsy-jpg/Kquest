-- Avoid PL/pgSQL ambiguity between the RETURNS TABLE output variable
-- `mock_quest_id` and mock_quest_completions.mock_quest_id.
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

  select catalog.xp into v_xp
  from public.mock_quest_catalog as catalog
  where catalog.id = p_mock_quest_id;
  if not found then raise exception 'Unknown demo quest'; end if;

  if p_storage_path not like v_user_id::text || '/%' then raise exception 'Invalid proof storage path'; end if;
  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then raise exception 'Unsupported image type'; end if;
  if p_size_bytes <= 0 or p_size_bytes > 10485760 then raise exception 'Invalid image size'; end if;
  if not exists (
    select 1
    from storage.objects as object
    where object.bucket_id = 'quest-proofs'
      and object.name = p_storage_path
      and object.owner_id = v_user_id::text
  ) then raise exception 'Uploaded proof object not found'; end if;

  insert into public.mock_quest_proofs (
    user_id, mock_quest_id, storage_path, mime_type, size_bytes
  ) values (
    v_user_id, p_mock_quest_id, p_storage_path, p_mime_type, p_size_bytes
  );

  insert into public.mock_quest_completions (
    user_id, mock_quest_id, xp_awarded
  ) values (
    v_user_id, p_mock_quest_id, v_xp
  )
  on conflict on constraint mock_quest_completions_pkey do nothing;

  perform public.bump_streak(v_user_id);

  return query select p_mock_quest_id, v_xp;
end;
$$;
