-- Restaurant ratings with photos
create table public.restaurant_ratings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  item_id       uuid references public.itinerary_items(id) on delete set null,
  restaurant_name text not null,
  restaurant_id   text, -- Foursquare fsq_place_id for deduplication
  location      text,
  rating        integer not null check (rating >= 1 and rating <= 5),
  review        text,
  visited_date  date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Rating photos
create table public.rating_photos (
  id          uuid primary key default gen_random_uuid(),
  rating_id   uuid not null references public.restaurant_ratings(id) on delete cascade,
  photo_url   text not null,
  created_at  timestamptz not null default now()
);

-- Storage bucket for rating photos
insert into storage.buckets (id, name, public)
values ('rating-photos', 'rating-photos', true)
on conflict (id) do nothing;

create policy "rating_photos_upload" on storage.objects
  for insert with check (bucket_id = 'rating-photos' and auth.uid() is not null);

create policy "rating_photos_read" on storage.objects
  for select using (bucket_id = 'rating-photos');

create policy "rating_photos_delete" on storage.objects
  for delete using (bucket_id = 'rating-photos' and auth.uid() is not null);

-- RLS
alter table public.restaurant_ratings enable row level security;
alter table public.rating_photos enable row level security;

-- Anyone can read ratings (for friend recommendations)
create policy "ratings_select" on public.restaurant_ratings
  for select using (true);

create policy "ratings_insert" on public.restaurant_ratings
  for insert with check (auth.uid() = user_id);

create policy "ratings_update" on public.restaurant_ratings
  for update using (auth.uid() = user_id);

create policy "ratings_delete" on public.restaurant_ratings
  for delete using (auth.uid() = user_id);

create policy "rating_photos_select" on public.rating_photos
  for select using (true);

create policy "rating_photos_insert" on public.rating_photos
  for insert with check (
    exists (select 1 from public.restaurant_ratings r where r.id = rating_photos.rating_id and r.user_id = auth.uid())
  );

create policy "rating_photos_delete" on public.rating_photos
  for delete using (
    exists (select 1 from public.restaurant_ratings r where r.id = rating_photos.rating_id and r.user_id = auth.uid())
  );

-- Index for fast friend recommendation lookups
create index idx_ratings_restaurant_id on public.restaurant_ratings(restaurant_id);
create index idx_ratings_user_id on public.restaurant_ratings(user_id);
