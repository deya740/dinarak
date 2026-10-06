-- شغّل هالملف مرة وحدة: Supabase > SQL Editor > New query > الصق > Run

create table if not exists public.user_data (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_data_size check (octet_length(data::text) < 2000000)
);

alter table public.user_data enable row level security;

drop policy if exists "own select" on public.user_data;
drop policy if exists "own insert" on public.user_data;
drop policy if exists "own update" on public.user_data;
drop policy if exists "own delete" on public.user_data;

create policy "own select" on public.user_data for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own insert" on public.user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own update" on public.user_data for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own delete" on public.user_data for delete to authenticated
  using ((select auth.uid()) = user_id);
