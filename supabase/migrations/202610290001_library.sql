-- Apply with the Supabase SQL Editor or CLI after inspecting the project's existing schema.
-- Requires Supabase Auth. Anonymous clients have no access to the library.
begin;

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 60),
  color text not null default 'blue' check (color in ('blue', 'purple', 'orange', 'gray')),
  system_key text check (system_key in ('own', 'partners', 'promo', 'archive')),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, system_key)
);
create unique index folders_owner_name_unique on public.folders (user_id, lower(name));

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 255),
  file_type text not null check (file_type in ('image', 'video')),
  mime_type text not null check (
    (file_type = 'image' and mime_type like 'image/%') or
    (file_type = 'video' and mime_type like 'video/%')
  ),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  storage_path text not null unique check (
    split_part(storage_path, '/', 1) = user_id::text and
    split_part(storage_path, '/', 2) = id::text and
    char_length(split_part(storage_path, '/', 3)) > 0 and
    array_length(string_to_array(storage_path, '/'), 1) = 3
  ),
  created_at timestamptz not null default now(),
  constraint ads_folder_owner_fkey foreign key (folder_id, user_id)
    references public.folders (id, user_id) on delete restrict
);
create index ads_owner_created_idx on public.ads (user_id, created_at desc);
create index ads_folder_idx on public.ads (folder_id, user_id);

alter table public.folders enable row level security;
alter table public.ads enable row level security;

revoke all on public.folders, public.ads from anon, authenticated;
grant select, insert on public.folders to authenticated;
grant select, insert, delete on public.ads to authenticated;

create policy folders_select_own on public.folders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy folders_insert_own on public.folders for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy ads_select_own on public.ads for select to authenticated
  using ((select auth.uid()) = user_id);
create policy ads_insert_own on public.ads for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy ads_delete_own on public.ads for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Idempotent per user, with normal RLS permissions (never SECURITY DEFINER).
create function public.initialize_library()
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  insert into public.folders (user_id, name, color, system_key) values
    (auth.uid(), 'Minhas Empresas', 'blue', 'own'),
    (auth.uid(), 'Empresas Parceiras', 'purple', 'partners'),
    (auth.uid(), 'Campanhas Promocionais', 'orange', 'promo'),
    (auth.uid(), 'Anúncios Arquivados', 'gray', 'archive')
  on conflict do nothing;
end;
$$;
revoke all on function public.initialize_library() from public, anon;
grant execute on function public.initialize_library() to authenticated;

commit;
