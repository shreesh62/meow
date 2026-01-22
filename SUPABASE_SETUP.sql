-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SPACES TABLE
create table if not exists public.spaces (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USERS TABLE
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references public.spaces(id) on delete cascade not null,
  name text not null,
  avatar_color text default 'bg-pastel-blue',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MOODS TABLE
create table if not exists public.moods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  emoji text not null,
  label text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. QNA TABLE (Questions)
create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  options jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ANSWERS TABLE
create table if not exists public.answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  selected_option_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(question_id, user_id)
);

-- ENABLE REALTIME
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.moods, public.answers, public.spaces;
commit;

-- SEED DATA (Only if empty)
insert into public.questions (text, options)
select 'How was your sleep?', '["Great", "Okay", "Bad", "Terrible"]'
where not exists (select 1 from public.questions where text = 'How was your sleep?');

insert into public.questions (text, options)
select 'What do you crave right now?', '["Pizza", "Sushi", "Burger", "Salad"]'
where not exists (select 1 from public.questions where text = 'What do you crave right now?');

insert into public.questions (text, options)
select 'Energy level?', '["High", "Medium", "Low", "Zombie"]'
where not exists (select 1 from public.questions where text = 'Energy level?');

insert into public.questions (text, options)
select 'Ideal date night?', '["Movie", "Dinner", "Walk", "Gaming"]'
where not exists (select 1 from public.questions where text = 'Ideal date night?');

insert into public.questions (text, options)
select 'Who is cuter?', '["Me", "You", "Both", "Cat"]'
where not exists (select 1 from public.questions where text = 'Who is cuter?');

insert into public.questions (text, options)
select 'Current vibe?', '["Chill", "Chaotic", "Focused", "Lazy"]'
where not exists (select 1 from public.questions where text = 'Current vibe?');

insert into public.questions (text, options)
select 'Need a hug?', '["YES!", "Maybe", "I''m good", "Send virtual hug"]'
where not exists (select 1 from public.questions where text = 'Need a hug?');

-- RLS POLICIES (Idempotent)
alter table public.spaces enable row level security;
drop policy if exists "Public access for MVP" on public.spaces;
create policy "Public access for MVP" on public.spaces for all using (true);

alter table public.users enable row level security;
drop policy if exists "Public access for MVP" on public.users;
create policy "Public access for MVP" on public.users for all using (true);

alter table public.moods enable row level security;
drop policy if exists "Public access for MVP" on public.moods;
create policy "Public access for MVP" on public.moods for all using (true);

alter table public.questions enable row level security;
drop policy if exists "Public access for MVP" on public.questions;
create policy "Public access for MVP" on public.questions for all using (true);

alter table public.answers enable row level security;
drop policy if exists "Public access for MVP" on public.answers;
create policy "Public access for MVP" on public.answers for all using (true);
