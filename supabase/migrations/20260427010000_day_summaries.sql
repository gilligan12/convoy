-- Cached AI-generated day summaries
-- Format: {"2026-06-01": {"summary": "...", "hash": "abc123"}, ...}
alter table public.trips
  add column if not exists day_summaries jsonb not null default '{}'::jsonb;
