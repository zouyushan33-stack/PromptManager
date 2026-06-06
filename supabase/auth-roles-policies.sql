-- PromptManager authentication, roles, and prompt authorization.
-- Run this file in the Supabase SQL Editor.
-- Owner account: zou_yushan@163.com

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_email_idx on public.profiles(email);

insert into public.profiles (id, email, display_name, role, created_at, updated_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'display_name', users.raw_user_meta_data ->> 'full_name', users.email, 'User'),
  case when lower(users.email) = 'zou_yushan@163.com' then 'owner' else 'user' end,
  now(),
  now()
from auth.users
as users
where users.email is not null
on conflict (id) do update
set
  email = excluded.email,
  display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
  role = case
    when lower(excluded.email) = 'zou_yushan@163.com' then 'owner'
    else public.profiles.role
  end,
  updated_at = now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.email, 'User'),
    case when lower(new.email) = 'zou_yushan@163.com' then 'owner' else 'user' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    role = case
      when lower(excluded.email) = 'zou_yushan@163.com' then 'owner'
      else public.profiles.role
    end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then 'anon'
    when lower(coalesce(auth.jwt() ->> 'email', '')) = 'zou_yushan@163.com' then 'owner'
    else coalesce((select role from public.profiles where id = auth.uid()), 'user')
  end;
$$;

create or replace function public.current_user_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'owner';
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'owner');
$$;

create or replace function public.prepare_prompt_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
  elsif tg_op = 'UPDATE' then
    if new.user_id <> old.user_id then
      raise exception 'Prompt owner cannot be changed';
    end if;

    new.created_at = old.created_at;
    new.updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists prompts_prepare_write on public.prompts;
create trigger prompts_prepare_write
before insert or update on public.prompts
for each row
execute function public.prepare_prompt_write();

grant usage on schema public to anon, authenticated;
grant select on table public.prompts to anon, authenticated;
grant insert, update, delete on table public.prompts to authenticated;
grant select on table public.profiles to authenticated;
grant update(display_name, role, updated_at) on table public.profiles to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.prompts enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can read prompts" on public.prompts;
drop policy if exists "Authenticated users can create own prompts" on public.prompts;
drop policy if exists "Users can update own prompts" on public.prompts;
drop policy if exists "Users can delete own prompts" on public.prompts;
drop policy if exists "Authenticated users can update manageable prompts" on public.prompts;
drop policy if exists "Authenticated users can delete manageable prompts" on public.prompts;

create policy "Public can read prompts"
on public.prompts
for select
to anon, authenticated
using (true);

create policy "Authenticated users can create own prompts"
on public.prompts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Authenticated users can update manageable prompts"
on public.prompts
for update
to authenticated
using (auth.uid() = user_id or public.current_user_is_admin())
with check (auth.uid() = user_id or public.current_user_is_admin());

create policy "Authenticated users can delete manageable prompts"
on public.prompts
for delete
to authenticated
using (auth.uid() = user_id or public.current_user_is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Owner can read all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Owner can update user roles" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_is_owner());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = public.current_user_role());

create policy "Owner can update user roles"
on public.profiles
for update
to authenticated
using (public.current_user_is_owner() and role <> 'owner')
with check (public.current_user_is_owner() and role in ('user', 'admin'));
