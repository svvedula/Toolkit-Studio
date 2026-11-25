-- Toolkit Studio core schema (cloud sync, Phase 1-3).
-- Every user-owned row is scoped by user id through row-level security.
-- The client never supplies owner ids: defaults come from auth.uid().

create extension if not exists pgcrypto;

-- catalog (public read, admin write)
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  access_tier text not null check (access_tier in ('Free','Freemium','Paid','Open source')),
  skill_tier text not null check (skill_tier in ('Beginner','Intermediate','Advanced')),
  url text not null,
  embeddable boolean not null default false,
  description text not null,
  tags text[] not null default '{}'
);
alter table public.tools enable row level security;
create policy "catalog is public" on public.tools for select using (true);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null default 'My workspace',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  goal text not null,
  kind text,
  intake_answers jsonb not null default '[]',
  blueprint jsonb,
  blueprint_version int not null default 1,
  is_public boolean not null default false,
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_of date not null,
  progress_note text not null,
  blockers text,
  ai_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_type text not null check (item_type in ('tool','project','prompt')),
  item_id text not null,
  unique (owner_id, item_type, item_id)
);

-- ambient layer (Phase 3)
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  kind text not null,               -- rss | api | reddit | jobs | news
  config jsonb not null default '{}',
  enabled boolean not null default true
);
create table if not exists public.signals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  source_id uuid references public.sources,
  summary text not null,
  url text,
  raw jsonb,
  dedupe_hash text not null,
  score numeric, cost_estimate numeric, revenue_estimate numeric, effort_score numeric, profit_effort_ratio numeric,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  unique (project_id, dedupe_hash)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  signal_id uuid references public.signals on delete cascade,
  title text not null, body text,
  read_at timestamptz, pushed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_email text not null,
  tool_name text not null,
  url text not null,
  tier text not null check (tier in ('standard','fast_track','sponsored')),
  status text not null default 'pending',
  review_note text,
  created_at timestamptz not null default now()
);

-- RLS: owner-only for everything user-owned
alter table public.workspaces enable row level security;
alter table public.projects enable row level security;
alter table public.checkins enable row level security;
alter table public.saved_items enable row level security;
alter table public.signals enable row level security;
alter table public.notifications enable row level security;
alter table public.sources enable row level security;
alter table public.submissions enable row level security;

create policy "own workspaces" on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own projects" on public.projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- public blueprints (/p/:slug) are readable by anyone; cloning happens server-side into the caller's workspace
create policy "public projects readable" on public.projects for select using (is_public);
create policy "own checkins" on public.checkins for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own saved" on public.saved_items for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own signals" on public.signals for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own notifications" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "anyone can submit" on public.submissions for insert with check (true);
-- sources and submission review are admin-only (service role bypasses RLS)

create index if not exists projects_owner_idx on public.projects (owner_id);
create index if not exists checkins_project_idx on public.checkins (project_id);
create index if not exists signals_project_idx on public.signals (project_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, read_at);
