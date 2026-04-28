-- Add email to profiles for friend search
alter table public.profiles add column if not exists email text;

-- Backfill existing profiles with email from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- Update the handle_new_user trigger to also store email
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$;
