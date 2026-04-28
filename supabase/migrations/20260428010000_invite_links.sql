-- Add a shareable invite link token per trip
alter table public.trips
  add column if not exists invite_token uuid not null default gen_random_uuid();

-- Allow anyone with a valid invite token to join
create or replace function public.join_trip_by_token(p_token uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_trip_id uuid;
begin
  select id into v_trip_id from public.trips where invite_token = p_token;
  if v_trip_id is null then
    raise exception 'Invalid invite link';
  end if;

  -- Check if already a member
  if exists (select 1 from public.trip_members where trip_id = v_trip_id and user_id = auth.uid()) then
    return v_trip_id;
  end if;

  -- Add as viewer
  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip_id, auth.uid(), 'viewer');

  return v_trip_id;
end;
$$;
