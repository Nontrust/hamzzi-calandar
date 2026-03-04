-- Base schema and role model
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('A', 'B')),
  display_name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('running', 'finished')),
  start_at timestamptz not null,
  end_at timestamptz,
  achievement_rate numeric(5,2),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.study_sessions(id) on delete cascade,
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  status text not null check (status in ('done', 'not_done')),
  target_date date,
  migrated_to_date date,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  organization_name text not null,
  title text not null,
  dedup_key text not null unique,
  apply_start date,
  apply_end date,
  exam_date date,
  result_date date,
  interview_date date,
  url text,
  calendar_sync_status text not null default 'not_connected' check (calendar_sync_status in ('not_connected', 'pending', 'synced', 'failed')),
  calendar_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null,
  persona text not null,
  transcript jsonb not null default '[]'::jsonb,
  report jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_exam_events_updated_at on public.exam_events;
create trigger trg_exam_events_updated_at
before update on public.exam_events
for each row execute function public.touch_updated_at();