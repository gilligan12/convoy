-- Combined function: get trip ID + items by invite token (bypasses RLS)
create or replace function public.get_calendar_data(p_token uuid)
returns json
language plpgsql
security definer
stable
as $$
declare
  v_trip_id uuid;
  v_trip_name text;
  v_items json;
begin
  select id, name into v_trip_id, v_trip_name
  from public.trips where invite_token = p_token;

  if v_trip_id is null then
    return null;
  end if;

  select json_agg(row_to_json(i) order by i.date, i.start_time, i.sort_order)
  into v_items
  from public.itinerary_items i
  where i.trip_id = v_trip_id;

  return json_build_object(
    'trip_name', v_trip_name,
    'items', coalesce(v_items, '[]'::json)
  );
end;
$$;
