-- PromptManager policies for public browsing and authenticated writes.
-- Supabase anonymous sign-ins use the authenticated role after login.
-- For email login, roles, admins, and owner permissions, run auth-roles-policies.sql instead.

grant usage on schema public to anon, authenticated;
grant select on table public.prompts to anon, authenticated;
grant insert, update, delete on table public.prompts to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.prompts enable row level security;

drop policy if exists "Public can read prompts" on public.prompts;
create policy "Public can read prompts"
on public.prompts
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can create own prompts" on public.prompts;
create policy "Authenticated users can create own prompts"
on public.prompts
for insert
to authenticated
with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own prompts" on public.prompts;
create policy "Users can update own prompts"
on public.prompts
for update
to authenticated
using (auth.uid()::text = user_id::text)
with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can delete own prompts" on public.prompts;
create policy "Users can delete own prompts"
on public.prompts
for delete
to authenticated
using (auth.uid()::text = user_id::text);
