-- Add username to profiles
alter table public.profiles add column if not exists username text;

-- Unique constraint on username (case-insensitive)
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username));
