-- Document vault for personal and trip documents

-- Personal documents (passports, IDs, vaccination cards — persist across trips)
create table public.personal_documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  doc_type      text not null, -- passport, id, visa, vaccination, insurance, global_entry, other
  title         text not null,
  file_url      text not null,
  file_name     text not null,
  file_type     text,
  file_size     integer,
  country       text, -- for visas/passports
  doc_number    text, -- passport number, policy number, etc.
  expiry_date   date,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Trip documents (booking confirmations, trip insurance, etc.)
create table public.trip_documents (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  uploaded_by   uuid not null references public.profiles(id) on delete cascade,
  doc_type      text not null, -- booking, insurance, visa, itinerary, receipt, other
  title         text not null,
  file_url      text not null,
  file_name     text not null,
  file_type     text,
  file_size     integer,
  notes         text,
  created_at    timestamptz not null default now()
);

-- Storage bucket for vault documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "documents_upload" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "documents_read" on storage.objects
  for select using (bucket_id = 'documents');

create policy "documents_delete" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid() is not null);

-- RLS
alter table public.personal_documents enable row level security;
alter table public.trip_documents enable row level security;

-- Personal docs: only the owner can see/manage
create policy "personal_docs_select" on public.personal_documents
  for select using (auth.uid() = user_id);

create policy "personal_docs_insert" on public.personal_documents
  for insert with check (auth.uid() = user_id);

create policy "personal_docs_update" on public.personal_documents
  for update using (auth.uid() = user_id);

create policy "personal_docs_delete" on public.personal_documents
  for delete using (auth.uid() = user_id);

-- Trip docs: visible to trip members
create policy "trip_docs_select" on public.trip_documents
  for select using (
    trip_id in (select public.user_trip_ids())
  );

create policy "trip_docs_insert" on public.trip_documents
  for insert with check (
    trip_id in (select public.user_trip_ids())
  );

create policy "trip_docs_delete" on public.trip_documents
  for delete using (
    uploaded_by = auth.uid()
  );
