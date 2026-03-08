-- Align anniversaries table for plain PostgreSQL app auth

drop policy if exists "anniversaries-own-read" on public.anniversaries;
drop policy if exists "anniversaries-own-write" on public.anniversaries;

alter table if exists public.anniversaries
  alter column user_id type text using user_id::text;

alter table if exists public.anniversaries
  disable row level security;
