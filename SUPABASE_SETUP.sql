-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SPACES TABLE
create table public.spaces (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USERS TABLE (No Auth table dependency, purely app-logic users)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid references public.spaces(id) on delete cascade not null,
  name text not null, -- Just a nickname
  avatar_color text default 'pastel-blue',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MOODS TABLE
create table public.moods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  emoji text not null,
  label text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. QNA TABLE (Questions)
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  options jsonb not null, -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ANSWERS TABLE
create table public.answers (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  space_id uuid references public.spaces(id) on delete cascade not null,
  selected_option_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(question_id, user_id)
);

-- ENABLE REALTIME
alter publication supabase_realtime add table public.moods;
alter publication supabase_realtime add table public.answers;
alter publication supabase_realtime add table public.spaces;

-- SEED DATA (Optional Questions)
insert into public.questions (text, options) values
('How was your sleep?', '["Great", "Okay", "Bad", "Terrible"]'),
('What do you crave right now?', '["Pizza", "Sushi", "Burger", "Salad"]'),
('Energy level?', '["High", "Medium", "Low", "Zombie"]'),
('Ideal date night?', '["Movie", "Dinner", "Walk", "Gaming"]'),
('Who is cuter?', '["Me", "You", "Both", "Cat"]'),
('Current vibe?', '["Chill", "Chaotic", "Focused", "Lazy"]'),
('Need a hug?', '["YES!", "Maybe", "I''m good", "Send virtual hug"]');

-- RLS POLICIES (Simplified for this MVP)
-- In a production app with Auth, you'd check auth.uid(). 
-- Here we rely on the client knowing the UUIDs. 
-- You can enable RLS and add policies like "allow all" for now or stricter based on matching space_id if you pass it in headers.
alter table public.spaces enable row level security;
create policy "Public access for MVP" on public.spaces for all using (true);

alter table public.users enable row level security;
create policy "Public access for MVP" on public.users for all using (true);

alter table public.moods enable row level security;
create policy "Public access for MVP" on public.moods for all using (true);

alter table public.questions enable row level security;
create policy "Public access for MVP" on public.questions for all using (true);

alter table public.answers enable row level security;
create policy "Public access for MVP" on public.answers for all using (true);
