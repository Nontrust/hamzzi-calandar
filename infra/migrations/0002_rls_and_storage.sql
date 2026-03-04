alter table public.profiles enable row level security;
alter table public.study_sessions enable row level security;
alter table public.todo_items enable row level security;
alter table public.interview_sessions enable row level security;

create policy if not exists "profiles-own-read" on public.profiles
for select using (auth.uid() = user_id);

create policy if not exists "profiles-own-write" on public.profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "sessions-own-profile" on public.study_sessions
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.user_id = auth.uid()
  )
);

create policy if not exists "todo-own-profile" on public.todo_items
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = owner_profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = owner_profile_id and p.user_id = auth.uid()
  )
);

create policy if not exists "interview-own-profile" on public.interview_sessions
for all using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = profile_id and p.user_id = auth.uid()
  )
);

create or replace function public.is_role_a(profile uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles p where p.id = profile and p.role = 'A'
  );
$$;

insert into storage.buckets (id, name, public)
values ('memories', 'memories', false)
on conflict (id) do nothing;

create policy if not exists "memories-read-own" on storage.objects
for select using (
  bucket_id = 'memories' and owner = auth.uid()
);

create policy if not exists "memories-insert-own" on storage.objects
for insert with check (
  bucket_id = 'memories' and owner = auth.uid()
);

create policy if not exists "memories-delete-own" on storage.objects
for delete using (
  bucket_id = 'memories' and owner = auth.uid()
);