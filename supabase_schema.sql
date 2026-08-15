-- Give2Get Supabase Database Schema Setup
-- Copy and run this script in your Supabase SQL Editor (https://supabase.com -> Project -> SQL Editor)

-- 1. Create projects table
create table if not exists public.projects (
  id text primary key,
  title text not null,
  description text not null,
  author text not null,
  author_title text,
  tags text[] default array[]::text[],
  demo_url text,
  github_url text,
  reviews_count integer default 0,
  target_reviews integer default 5,
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create reviews table referencing projects
create table if not exists public.reviews (
  id text primary key,
  project_id text references public.projects(id) on delete cascade not null,
  author text not null,
  content text not null,
  score_design integer default 4,
  score_code integer default 4,
  score_performance integer default 4,
  category text default 'ui',
  rating integer default 5,
  helpful_count integer default 0,
  is_resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.reviews enable row level security;

-- 4. Create public access policies
drop policy if exists "Allow read access to projects" on public.projects;
create policy "Allow read access to projects" on public.projects for select using (true);

drop policy if exists "Allow insert access to projects" on public.projects;
create policy "Allow insert access to projects" on public.projects for insert with check (true);

drop policy if exists "Allow update access to projects" on public.projects;
create policy "Allow update access to projects" on public.projects for update using (true) with check (true);

drop policy if exists "Allow read access to reviews" on public.reviews;
create policy "Allow read access to reviews" on public.reviews for select using (true);

drop policy if exists "Allow insert access to reviews" on public.reviews;
create policy "Allow insert access to reviews" on public.reviews for insert with check (true);

drop policy if exists "Allow update access to reviews" on public.reviews;
create policy "Allow update access to reviews" on public.reviews for update using (true) with check (true);

-- 5. Enable real-time for projects and reviews (Run in SQL editor if not enabled)
-- alter publication supabase_realtime add table public.projects;
-- alter publication supabase_realtime add table public.reviews;

-- 6. Create profiles table
create table if not exists public.profiles (
  id text primary key, -- user email or auth uid
  github_username text,
  avatar_url text,
  is_verified boolean default false,
  repo_stats jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Allow read access to profiles" on public.profiles;
create policy "Allow read access to profiles" on public.profiles for select using (true);

drop policy if exists "Allow insert/update to profiles" on public.profiles;
create policy "Allow insert/update to profiles" on public.profiles for all using (true) with check (true);

