-- Friends system
-- A friendship is bidirectional: when accepted, both users are friends.
-- Status: pending (request sent), accepted, declined

create type public.friendship_status as enum ('pending', 'accepted', 'declined');

create table public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        public.friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id != addressee_id)
);

alter table public.friendships enable row level security;

-- Users can see friendships they're part of
create policy "friendships_select" on public.friendships
  for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- Users can send friend requests
create policy "friendships_insert" on public.friendships
  for insert with check (
    auth.uid() = requester_id
  );

-- Users can accept/decline requests sent to them, or cancel ones they sent
create policy "friendships_update" on public.friendships
  for update using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- Users can delete friendships they're part of (unfriend)
create policy "friendships_delete" on public.friendships
  for delete using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

-- Add email column to profiles for friend search (if not already searchable)
-- profiles already has id linked to auth.users, but we need email for searching
-- We'll query auth.users email via the user metadata instead

-- Index for fast lookups
create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);
create index idx_friendships_status on public.friendships(status);
