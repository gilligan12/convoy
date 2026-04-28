-- ============================================================
-- PROFILES
-- Extended user data linked to Supabase Auth
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIPS
-- ============================================================
create table public.trips (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  destination   text,
  description   text,
  cover_url     text,
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- TRIP MEMBERS
-- who has access to a trip (owner + invited users)
-- ============================================================
create type public.member_role as enum ('owner', 'editor', 'viewer');

create table public.trip_members (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.member_role not null default 'viewer',
  joined_at  timestamptz not null default now(),
  unique (trip_id, user_id)
);

-- Auto-add the owner as a member when a trip is created
create or replace function public.handle_new_trip()
returns trigger language plpgsql security definer as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

-- ============================================================
-- INVITATIONS
-- pending invites by email (user may not have account yet)
-- ============================================================
create type public.invite_status as enum ('pending', 'accepted', 'declined');

create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  invited_by  uuid not null references public.profiles(id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'viewer',
  token       uuid not null default gen_random_uuid(),
  status      public.invite_status not null default 'pending',
  created_at  timestamptz not null default now(),
  unique (trip_id, email)
);

-- ============================================================
-- ITINERARY ITEMS
-- day-by-day activities, flights, hotels, etc.
-- ============================================================
create type public.item_type as enum (
  'activity', 'flight', 'hotel', 'restaurant', 'transport', 'note'
);

create table public.itinerary_items (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  created_by   uuid not null references public.profiles(id) on delete cascade,
  type         public.item_type not null default 'activity',
  title        text not null,
  description  text,
  location     text,
  date         date,
  start_time   time,
  end_time     time,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only see/edit trips they are members of
-- ============================================================
alter table public.profiles        enable row level security;
alter table public.trips           enable row level security;
alter table public.trip_members    enable row level security;
alter table public.invitations     enable row level security;
alter table public.itinerary_items enable row level security;

-- Profiles: users can read any profile, only edit their own
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Trips: visible to members only
create policy "trips_select" on public.trips
  for select using (
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid()
    )
  );

create policy "trips_insert" on public.trips
  for insert with check (auth.uid() = owner_id);

create policy "trips_update" on public.trips
  for update using (
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "trips_delete" on public.trips
  for delete using (auth.uid() = owner_id);

-- Trip members: visible to other members of the same trip
create policy "trip_members_select" on public.trip_members
  for select using (
    exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()
    )
  );

create policy "trip_members_insert" on public.trip_members
  for insert with check (
    exists (
      select 1 from public.trip_members
      where trip_id = trip_members.trip_id and user_id = auth.uid()
        and role = 'owner'
    )
    or auth.uid() = user_id
  );

create policy "trip_members_delete" on public.trip_members
  for delete using (
    auth.uid() = user_id
    or exists (
      select 1 from public.trip_members
      where trip_id = trip_members.trip_id and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Invitations: visible to trip members, manageable by owners/editors
create policy "invitations_select" on public.invitations
  for select using (
    exists (
      select 1 from public.trip_members
      where trip_id = invitations.trip_id and user_id = auth.uid()
    )
  );

create policy "invitations_insert" on public.invitations
  for insert with check (
    exists (
      select 1 from public.trip_members
      where trip_id = invitations.trip_id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "invitations_update" on public.invitations
  for update using (true);

create policy "invitations_delete" on public.invitations
  for delete using (
    exists (
      select 1 from public.trip_members
      where trip_id = invitations.trip_id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

-- Itinerary items: readable by members, writable by editors/owners
create policy "items_select" on public.itinerary_items
  for select using (
    exists (
      select 1 from public.trip_members
      where trip_id = itinerary_items.trip_id and user_id = auth.uid()
    )
  );

create policy "items_insert" on public.itinerary_items
  for insert with check (
    exists (
      select 1 from public.trip_members
      where trip_id = itinerary_items.trip_id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "items_update" on public.itinerary_items
  for update using (
    exists (
      select 1 from public.trip_members
      where trip_id = itinerary_items.trip_id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create policy "items_delete" on public.itinerary_items
  for delete using (
    exists (
      select 1 from public.trip_members
      where trip_id = itinerary_items.trip_id and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );
