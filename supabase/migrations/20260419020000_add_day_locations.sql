-- Add day-level locations to trips (e.g. {"2026-06-01": "Dubrovnik", "2026-06-02": "Hvar"})
alter table public.trips
  add column if not exists day_locations jsonb not null default '{}'::jsonb;
