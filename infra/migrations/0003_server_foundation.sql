-- Server foundation hardening: external token lifecycle + audit logs

create table if not exists public.external_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  provider text not null check (provider in ('google_calendar')),
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  expires_at timestamptz not null,
  refreshed_at timestamptz not null default now(),
  retry_count int not null default 0,
  token_state text not null default 'active' check (token_state in ('active', 'refresh_retry', 'reauth_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  user_id uuid,
  action text not null,
  resource text not null,
  outcome text not null check (outcome in ('success', 'denied', 'error')),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_events_request_id on public.audit_events(request_id);
create index if not exists idx_audit_events_created_at on public.audit_events(created_at desc);

drop trigger if exists trg_external_oauth_tokens_updated_at on public.external_oauth_tokens;
create trigger trg_external_oauth_tokens_updated_at
before update on public.external_oauth_tokens
for each row execute function public.touch_updated_at();

alter table public.external_oauth_tokens enable row level security;
alter table public.audit_events enable row level security;

create policy if not exists "oauth-token-own-read" on public.external_oauth_tokens
for select using (auth.uid() = user_id);

create policy if not exists "oauth-token-own-write" on public.external_oauth_tokens
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "audit-events-own-read" on public.audit_events
for select using (auth.uid() = user_id);
