-- Allow reading basic trip info by invite token (for OG previews)
-- This bypasses RLS since the preview is public
create or replace function public.get_trip_preview(p_token uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'name', t.name,
    'destination', t.destination,
    'cover_url', t.cover_url,
    'start_date', t.start_date,
    'end_date', t.end_date,
    'owner_name', p.full_name
  ) into result
  from public.trips t
  join public.profiles p on p.id = t.owner_id
  where t.invite_token = p_token;

  return result;
end;
$$;
