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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS)
alter table public.projects enable row level security;
alter table public.reviews enable row level security;

-- 4. Create public access policies
create policy "Allow read access to projects" on public.projects for select using (true);
create policy "Allow insert access to projects" on public.projects for insert with check (true);

create policy "Allow read access to reviews" on public.reviews for select using (true);
create policy "Allow insert access to reviews" on public.reviews for insert with check (true);
