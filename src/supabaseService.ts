import { supabase } from './supabaseClient';
import type { Project, Review } from './components/Dashboard';

/*
-- RUN THIS IN YOUR SUPABASE SQL EDITOR --

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

alter table public.projects enable row level security;
alter table public.reviews enable row level security;

create policy "Allow read access to projects" on public.projects for select using (true);
create policy "Allow insert access to projects" on public.projects for insert with check (true);

create policy "Allow read access to reviews" on public.reviews for select using (true);
create policy "Allow insert access to reviews" on public.reviews for insert with check (true);
*/

export async function getSupabaseProjects(): Promise<Project[]> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  try {
    const { data: dbProjects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projError) throw projError;

    const { data: dbReviews, error: revError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (revError) throw revError;

    // Map database structures back to React components
    return (dbProjects || []).map(p => {
      const projReviews = (dbReviews || [])
        .filter(r => r.project_id === p.id)
        .map(r => ({
          id: r.id,
          author: r.author,
          content: r.content,
          scores: {
            design: r.score_design,
            code: r.score_code,
            performance: r.score_performance
          },
          category: r.category || 'ui',
          rating: r.rating || 5,
          helpfulCount: r.helpful_count || 0,
          isResolved: r.is_resolved || false,
          createdAt: r.created_at
        }));

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        author: p.author,
        authorTitle: p.author_title || '',
        tags: p.tags || [],
        demoUrl: p.demo_url || '',
        githubUrl: p.github_url || '',
        reviewsCount: p.reviews_count || 0,
        targetReviews: p.target_reviews || 5,
        is_featured: p.is_featured || false,
        reviews: projReviews
      };
    });
  } catch (error) {
    console.error('Failed to fetch from Supabase, returning empty list:', error);
    throw error;
  }
}

export async function createSupabaseProject(
  project: Omit<Project, 'id' | 'reviews' | 'reviewsCount' | 'targetReviews'>,
  isFeatured: boolean = false
): Promise<Project> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const newId = `p-db-${Date.now()}`;
  const record = {
    id: newId,
    title: project.title,
    description: project.description,
    author: project.author,
    author_title: project.authorTitle,
    tags: project.tags,
    demo_url: project.demoUrl,
    github_url: project.githubUrl,
    reviews_count: 0,
    target_reviews: 5,
    is_featured: isFeatured
  };

  const { error } = await supabase.from('projects').insert([record]);
  if (error) throw error;

  return {
    ...project,
    id: newId,
    reviewsCount: 0,
    targetReviews: 5,
    is_featured: isFeatured,
    reviews: []
  };
}

export async function createSupabaseReview(
  projectId: string,
  review: Omit<Review, 'id' | 'createdAt'>
): Promise<Review> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const newId = `r-db-${Date.now()}`;
  const record = {
    id: newId,
    project_id: projectId,
    author: review.author,
    content: review.content,
    score_design: review.scores.design,
    score_code: review.scores.code,
    score_performance: review.scores.performance,
    category: review.category || 'ui',
    rating: review.rating || 5,
    helpful_count: review.helpfulCount || 0,
    is_resolved: review.isResolved || false
  };

  const { error } = await supabase.from('reviews').insert([record]);
  if (error) throw error;

  // Increment review counter on projects
  const { data: currentProject } = await supabase.from('projects').select('reviews_count').eq('id', projectId).single();
  const currentCount = currentProject?.reviews_count || 0;
  
  await supabase
    .from('projects')
    .update({ reviews_count: currentCount + 1 })
    .eq('id', projectId);

  return {
    ...review,
    id: newId,
    createdAt: new Date().toISOString()
  };
}

export async function updateSupabaseReviewHelpful(reviewId: string, count: number): Promise<void> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { error } = await supabase
    .from('reviews')
    .update({ helpful_count: count })
    .eq('id', reviewId);
  if (error) throw error;
}

export async function updateSupabaseReviewResolved(reviewId: string, isResolved: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { error } = await supabase
    .from('reviews')
    .update({ is_resolved: isResolved })
    .eq('id', reviewId);
  if (error) throw error;
}

export interface UserProfileDB {
  id: string;
  github_username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  repo_stats: any;
  created_at?: string;
}

export async function fetchUserProfile(userId: string): Promise<UserProfileDB | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  return data;
}

export async function upsertUserProfile(profile: Partial<UserProfileDB> & { id: string }): Promise<UserProfileDB> {
  if (!supabase) throw new Error("Supabase client is not initialized.");
  const { data, error } = await supabase
    .from('profiles')
    .upsert([profile])
    .select()
    .single();

  if (error) throw error;
  return data;
}
