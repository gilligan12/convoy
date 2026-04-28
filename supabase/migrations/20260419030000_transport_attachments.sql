-- Storage bucket for transport documents (ferry tickets, etc.)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Storage policies: authenticated users can upload/read/delete their own files
create policy "attachments_upload" on storage.objects
  for insert with check (
    bucket_id = 'attachments' and auth.uid() is not null
  );

create policy "attachments_read" on storage.objects
  for select using (
    bucket_id = 'attachments'
  );

create policy "attachments_delete" on storage.objects
  for delete using (
    bucket_id = 'attachments' and auth.uid() is not null
  );

-- Attachments table linking files to itinerary items
create table public.attachments (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.itinerary_items(id) on delete cascade,
  file_name   text not null,
  file_url    text not null,
  file_type   text, -- mime type
  file_size   integer, -- bytes
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.attachments enable row level security;

-- Attachments visible to trip members (via the item's trip)
create policy "attachments_select" on public.attachments
  for select using (
    exists (
      select 1 from public.itinerary_items i
      where i.id = attachments.item_id
        and i.trip_id in (select public.user_trip_ids())
    )
  );

create policy "attachments_insert" on public.attachments
  for insert with check (
    exists (
      select 1 from public.itinerary_items i
      join public.trip_members tm on tm.trip_id = i.trip_id
      where i.id = attachments.item_id
        and tm.user_id = auth.uid()
        and tm.role in ('owner', 'editor')
    )
  );

create policy "attachments_delete" on public.attachments
  for delete using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from public.itinerary_items i
      where i.id = attachments.item_id
        and i.trip_id in (
          select trip_id from public.trip_members
          where user_id = auth.uid() and role = 'owner'
        )
    )
  );
