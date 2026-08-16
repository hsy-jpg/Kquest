-- Quest completion MVP: metadata, per-user progress, proof records, and private photo storage.

alter table public.quests
  add column if not exists proof_type text,
  add column if not exists proof_requirement text,
  add column if not exists completion_rule jsonb;

update public.quests q
set
  proof_type = case
    when exists (select 1 from jsonb_array_elements(q.steps) s where s->>'kind' = 'PHOTO') then 'PHOTO'
    when exists (select 1 from jsonb_array_elements(q.steps) s where s->>'verification' = 'TEXT_OR_CHOICE') then 'TEXT'
    else 'CHECK'
  end,
  proof_requirement = coalesce(
    (select s->>'prompt' from jsonb_array_elements(q.steps) s where s->>'kind' = 'PHOTO' limit 1),
    (select s->>'prompt' from jsonb_array_elements(q.steps) s where s->>'verification' = 'TEXT_OR_CHOICE' limit 1)
  ),
  completion_rule = jsonb_build_object(
    'requiredStepOrders', coalesce(
      (select jsonb_agg((s->>'order')::integer order by (s->>'order')::integer) from jsonb_array_elements(q.steps) s),
      '[]'::jsonb
    ),
    'minimumCompletedSteps', jsonb_array_length(q.steps),
    'proofRequired', jsonb_array_length(q.steps) > 0,
    'proofType', case
      when exists (select 1 from jsonb_array_elements(q.steps) s where s->>'kind' = 'PHOTO') then 'PHOTO'
      when exists (select 1 from jsonb_array_elements(q.steps) s where s->>'verification' = 'TEXT_OR_CHOICE') then 'TEXT'
      else 'CHECK'
    end
  )
where proof_type is null or completion_rule is null;

alter table public.quests
  alter column proof_type set default 'CHECK',
  alter column proof_type set not null,
  alter column completion_rule set default '{"requiredStepOrders":[],"minimumCompletedSteps":0,"proofRequired":false,"proofType":"NONE"}'::jsonb,
  alter column completion_rule set not null;

alter table public.quests
  add constraint quests_proof_type_check
    check (proof_type in ('PHOTO', 'TEXT', 'CHOICE', 'CHECK', 'NONE')),
  add constraint quests_completion_rule_object_check
    check (jsonb_typeof(completion_rule) = 'object');

create table public.user_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on update cascade on delete restrict,
  status text not null default 'AVAILABLE',
  started_at timestamptz,
  completed_at timestamptz,
  abandoned_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_quests_user_quest_key unique (user_id, quest_id),
  constraint user_quests_status_check check (
    status in ('AVAILABLE', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED')
  ),
  constraint user_quests_completed_at_check check (
    status <> 'COMPLETED' or completed_at is not null
  )
);

create index user_quests_user_status_idx on public.user_quests(user_id, status, updated_at desc);
create index user_quests_quest_status_idx on public.user_quests(quest_id, status);

create trigger user_quests_set_updated_at
before update on public.user_quests
for each row execute function public.set_updated_at();

create table public.quest_proofs (
  id uuid primary key default gen_random_uuid(),
  user_quest_id uuid not null references public.user_quests(id) on update cascade on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on update cascade on delete restrict,
  proof_type text not null,
  proof_status text not null default 'PENDING',
  storage_bucket text not null default 'quest-proofs',
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  proof_requirement_snapshot text,
  completion_rule_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quest_proofs_storage_path_key unique (storage_path),
  constraint quest_proofs_type_check check (proof_type in ('PHOTO', 'TEXT', 'CHOICE', 'CHECK', 'NONE')),
  constraint quest_proofs_status_check check (proof_status in ('PENDING', 'PASS', 'REVIEW', 'FAIL')),
  constraint quest_proofs_size_check check (size_bytes > 0 and size_bytes <= 10485760),
  constraint quest_proofs_completion_rule_object_check check (jsonb_typeof(completion_rule_snapshot) = 'object')
);

create index quest_proofs_user_submitted_idx on public.quest_proofs(user_id, submitted_at desc);
create index quest_proofs_user_quest_idx on public.quest_proofs(user_quest_id, submitted_at desc);
create index quest_proofs_status_idx on public.quest_proofs(proof_status, submitted_at);

create trigger quest_proofs_set_updated_at
before update on public.quest_proofs
for each row execute function public.set_updated_at();

alter table public.user_quests enable row level security;
alter table public.quest_proofs enable row level security;

create policy "Users can read own quest progress"
on public.user_quests for select to authenticated
using (user_id = auth.uid());

create policy "Users can read own quest proofs"
on public.quest_proofs for select to authenticated
using (user_id = auth.uid());

-- Writes are performed through the submit_quest_photo RPC so progress and proof stay consistent.
grant select on public.user_quests, public.quest_proofs to authenticated;
revoke insert, update, delete, truncate, references, trigger on public.user_quests, public.quest_proofs from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quest-proofs',
  'quest-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload own quest proof photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'quest-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can read own quest proof photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'quest-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own quest proof photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'quest-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_quest
  from public.quests
  where id = p_quest_id and status = 'PUBLISHED';

  if not found then
    raise exception 'Published quest not found';
  end if;

  if v_quest.proof_type <> 'PHOTO' then
    raise exception 'Quest does not accept photo proof';
  end if;

  if p_storage_path not like v_user_id::text || '/%' then
    raise exception 'Invalid proof storage path';
  end if;

  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Unsupported image type';
  end if;

  if p_size_bytes <= 0 or p_size_bytes > 10485760 then
    raise exception 'Invalid image size';
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
    user_quest_id,
    user_id,
    quest_id,
    proof_type,
    proof_status,
    storage_path,
    mime_type,
    size_bytes,
    proof_requirement_snapshot,
    completion_rule_snapshot
  ) values (
    v_user_quest_id,
    v_user_id,
    p_quest_id,
    v_quest.proof_type,
    'PENDING',
    p_storage_path,
    p_mime_type,
    p_size_bytes,
    v_quest.proof_requirement,
    v_quest.completion_rule
  ) returning id into v_proof_id;

  return query select v_user_quest_id, v_proof_id, 'COMPLETED'::text, 'PENDING'::text;
end;
$$;

revoke all on function public.submit_quest_photo(uuid, text, text, bigint) from public, anon;
grant execute on function public.submit_quest_photo(uuid, text, text, bigint) to authenticated;

comment on table public.user_quests is 'Per-user Quest lifecycle. Publication status remains on public.quests.';
comment on table public.quest_proofs is 'Immutable proof submissions with metadata snapshots; AI review is intentionally deferred.';
comment on function public.submit_quest_photo is 'Atomically records a PENDING photo proof and marks submission-complete Quest progress.';
