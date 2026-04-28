alter table public.trips
  add column if not exists day_notes jsonb not null default '{}'::jsonb;
