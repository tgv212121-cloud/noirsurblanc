-- Noirsurblanc — Database schema
-- Paste this into Supabase SQL Editor and run

-- ============================================================
-- TABLES
-- ============================================================

-- Clients
create table if not exists public.clients (
  id text primary key,
  name text not null,
  company text not null,
  avatar text not null,
  email text not null,
  phone text not null,
  status text not null check (status in ('active', 'onboarding', 'paused')),
  onboarded_at timestamptz not null default now(),
  linkedin_url text,
  created_at timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  content text not null,
  published_at date not null,
  status text not null check (status in ('draft', 'published', 'scheduled')),
  linkedin_url text,
  images text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_client_id on public.posts(client_id);
create index if not exists idx_posts_published_at on public.posts(published_at);
create index if not exists idx_posts_status on public.posts(status);

-- Metrics
create table if not exists public.metrics (
  post_id text primary key references public.posts(id) on delete cascade,
  impressions integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  reposts integer not null default 0,
  engagement_rate numeric(5,2) not null default 0,
  captured_at timestamptz not null default now()
);

-- Reminders
create table if not exists public.reminders (
  id text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  frequency text not null check (frequency in ('weekly', 'biweekly')),
  day_of_week integer not null check (day_of_week between 0 and 6),
  time text not null,
  message text not null,
  status text not null check (status in ('scheduled', 'sent', 'responded')),
  last_sent_at timestamptz,
  last_response_at timestamptz,
  response text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reminders_client_id on public.reminders(client_id);

-- Messages (conversation client/agence)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  sender text not null check (sender in ('admin', 'client')),
  text text,
  file_url text,
  voice_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_client_id on public.messages(client_id);
create index if not exists idx_messages_created_at on public.messages(created_at);

-- Onboarding answers
create table if not exists public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references public.clients(id) on delete cascade,
  question_id integer not null,
  answer jsonb not null,
  created_at timestamptz not null default now(),
  unique(client_id, question_id)
);

create index if not exists idx_onboarding_client_id on public.onboarding_answers(client_id);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Pour l'instant : tout ouvert (MVP).
-- À sécuriser plus tard avec auth et policies par client.

alter table public.clients enable row level security;
alter table public.posts enable row level security;
alter table public.metrics enable row level security;
alter table public.reminders enable row level security;
alter table public.messages enable row level security;
alter table public.onboarding_answers enable row level security;

-- Politiques permissives pour le MVP
create policy "public read clients" on public.clients for select using (true);
create policy "public write clients" on public.clients for all using (true) with check (true);

create policy "public read posts" on public.posts for select using (true);
create policy "public write posts" on public.posts for all using (true) with check (true);

create policy "public read metrics" on public.metrics for select using (true);
create policy "public write metrics" on public.metrics for all using (true) with check (true);

create policy "public read reminders" on public.reminders for select using (true);
create policy "public write reminders" on public.reminders for all using (true) with check (true);

create policy "public read messages" on public.messages for select using (true);
create policy "public write messages" on public.messages for all using (true) with check (true);

create policy "public read onboarding" on public.onboarding_answers for select using (true);
create policy "public write onboarding" on public.onboarding_answers for all using (true) with check (true);


-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Exécute ça APRÈS avoir créé les buckets dans le Dashboard Storage
-- ou utilise ces commandes SQL :

insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('message-files', 'message-files', true) on conflict (id) do nothing;

-- Policies storage — lecture publique, écriture ouverte pour le MVP
create policy "public read post-images" on storage.objects for select using (bucket_id = 'post-images');
create policy "public write post-images" on storage.objects for insert with check (bucket_id = 'post-images');
create policy "public delete post-images" on storage.objects for delete using (bucket_id = 'post-images');

create policy "public read message-files" on storage.objects for select using (bucket_id = 'message-files');
create policy "public write message-files" on storage.objects for insert with check (bucket_id = 'message-files');
create policy "public delete message-files" on storage.objects for delete using (bucket_id = 'message-files');
