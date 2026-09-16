-- Phase 1 of the Supabase Auth migration.
--
-- Keep the existing public.profiles.id values as the application's business
-- identifiers. Many workflow tables reference them. Supabase Auth owns a
-- separate UUID, so auth_user_id provides an explicit, reversible mapping.

alter table public.profiles
  add column if not exists auth_user_id uuid;

create unique index if not exists profiles_auth_user_id_key
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_auth_user_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users (id)
      on delete set null;
  end if;
end
$$;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles as p
  where p.auth_user_id = (select auth.uid())
    and not p.is_archived
  limit 1
$$;

create or replace function private.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles as p
  where p.auth_user_id = (select auth.uid())
    and not p.is_archived
  limit 1
$$;

revoke all on function private.current_profile_id() from public;
revoke all on function private.current_profile_role() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.current_profile_role() to authenticated;

comment on column public.profiles.auth_user_id is
  'Maps the legacy PubMark profile/business UUID to its Supabase Auth user.';
