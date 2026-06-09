-- PromptManager categories, ordering, and trash support.
-- Run this file in the Supabase SQL Editor before deploying the updated frontend.

alter table public.prompts
  add column if not exists category text not null default 'product',
  add column if not exists sort_order integer not null default 0,
  add column if not exists deleted_at timestamptz null,
  add column if not exists auto_delete_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'prompts_category_check'
      and conrelid = 'public.prompts'::regclass
  ) then
    alter table public.prompts
      add constraint prompts_category_check
      check (category in ('product', 'research'));
  end if;
end $$;

with ordered_prompts as (
  select
    id,
    row_number() over (
      partition by coalesce(category, 'product')
      order by created_at desc, id
    ) * 10 as next_sort_order
  from public.prompts
  where sort_order = 0
)
update public.prompts
set sort_order = ordered_prompts.next_sort_order
from ordered_prompts
where public.prompts.id = ordered_prompts.id;

create index if not exists prompts_active_category_sort_idx
on public.prompts(category, sort_order, created_at desc)
where deleted_at is null;

create index if not exists prompts_trash_auto_delete_idx
on public.prompts(auto_delete_at, deleted_at)
where deleted_at is not null;

create or replace function public.prepare_prompt_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, now());
    new.updated_at = coalesce(new.updated_at, now());
    new.category = coalesce(new.category, 'product');
    new.sort_order = coalesce(new.sort_order, 0);
    new.deleted_at = null;
    new.auto_delete_at = null;
  elsif tg_op = 'UPDATE' then
    if new.user_id <> old.user_id then
      raise exception 'Prompt owner cannot be changed';
    end if;

    new.created_at = old.created_at;
    new.category = coalesce(new.category, old.category, 'product');
    new.sort_order = coalesce(new.sort_order, old.sort_order, 0);
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
grant usage, select on all sequences in schema public to authenticated;

alter table public.prompts enable row level security;

drop policy if exists "Public can read prompts" on public.prompts;
drop policy if exists "Authenticated users can create own prompts" on public.prompts;
drop policy if exists "Users can update own prompts" on public.prompts;
drop policy if exists "Users can delete own prompts" on public.prompts;
drop policy if exists "Authenticated users can update manageable prompts" on public.prompts;
drop policy if exists "Authenticated users can delete manageable prompts" on public.prompts;
drop policy if exists "Admins can permanently delete prompts" on public.prompts;

create policy "Public can read prompts"
on public.prompts
for select
to anon, authenticated
using (deleted_at is null or public.current_user_is_admin());

create policy "Authenticated users can create own prompts"
on public.prompts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and deleted_at is null
  and auto_delete_at is null
);

create policy "Authenticated users can update manageable prompts"
on public.prompts
for update
to authenticated
using (
  public.current_user_is_admin()
  or (auth.uid() = user_id and deleted_at is null)
)
with check (
  public.current_user_is_admin()
  or auth.uid() = user_id
);

create policy "Admins can permanently delete prompts"
on public.prompts
for delete
to authenticated
using (public.current_user_is_admin());
