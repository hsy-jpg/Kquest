-- User-created Quest proposals. Kept separate from the curated TourAPI Quest pipeline.
create table public.quest_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  location text not null check (char_length(location) between 2 and 160),
  mission text not null check (char_length(mission) between 10 and 1000),
  category text not null check (category in ('Food', 'Culture', 'Nature', 'Nightlife', 'Shopping', 'Festival')),
  photo_path text not null,
  status text not null default 'UNDER_REVIEW' check (status in ('UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  created_at timestamptz not null default now()
);

alter table public.quest_submissions enable row level security;

create policy "Users can create their own Quest submissions"
on public.quest_submissions for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can read their own Quest submissions"
on public.quest_submissions for select to authenticated
using (auth.uid() = user_id);

grant select, insert on public.quest_submissions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quest-submission-photos',
  'quest-submission-photos',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view Quest submission photos"
on storage.objects for select to public
using (bucket_id = 'quest-submission-photos');

create policy "Users can upload their own Quest submission photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'quest-submission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their unsubmitted Quest photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'quest-submission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
