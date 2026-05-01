-- Allow fetching trip items for calendar export (bypasses RLS via security definer)
create or replace function public.get_trip_items_for_calendar(p_trip_id uuid)
returns setof public.itinerary_items
language sql
security definer
stable
as $$
  select * from public.itinerary_items
  where trip_id = p_trip_id
  order by date, start_time, sort_order;
$$;
