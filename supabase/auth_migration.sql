-- Lie un client à un compte auth Supabase
alter table public.clients add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- Table des rôles (admin / client)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('admin','client')),
  client_id text references public.clients(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "read profile self or admin" on public.profiles for select using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
