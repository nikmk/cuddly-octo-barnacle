create extension if not exists pgcrypto;

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  email text not null,
  phone text,
  city text,
  pain text,
  source text not null default 'landing-page',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists waitlist_email_unique_idx
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "public_can_insert_waitlist" on public.waitlist;
create policy "public_can_insert_waitlist"
on public.waitlist
for insert
to anon
with check (
  char_length(trim(name)) >= 2
  and email is not null
  and position('@' in email) > 1
);

drop policy if exists "no_public_select_waitlist" on public.waitlist;
create policy "no_public_select_waitlist"
on public.waitlist
for select
to anon
using (false);

revoke all on public.waitlist from anon;
grant insert on public.waitlist to anon;

create or replace function public.get_waitlist_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from public.waitlist;
$$;

grant execute on function public.get_waitlist_count() to anon;
