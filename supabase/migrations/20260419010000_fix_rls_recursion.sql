-- Fix infinite recursion in RLS policies.
-- The trip_members SELECT policy references trip_members itself,
-- causing a recursive loop. Fix: use a SECURITY DEFINER function
-- that bypasses RLS to get the user's trip IDs.

-- Helper: returns all trip_ids the current user belongs to
create or replace function public.user_trip_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from public.trip_members where user_id = auth.uid();
$$;

-- Drop the recursive policies
drop policy if exists "trips_select" on public.trips;
drop policy if exists "trip_members_select" on public.trip_members;

-- Recreate without recursion
create policy "trips_select" on public.trips
  for select using (
    id in (select public.user_trip_ids())
  );

create policy "trip_members_select" on public.trip_members
  for select using (
    trip_id in (select public.user_trip_ids())
  );
