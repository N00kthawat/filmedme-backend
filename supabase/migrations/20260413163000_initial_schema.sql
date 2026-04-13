begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle citext not null unique check (handle ~ '^[a-zA-Z0-9_]+$'),
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.presets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) <= 16),
  name text not null,
  description text not null default '',
  temperature integer not null default 0,
  grain integer not null default 0 check (grain >= 0 and grain <= 100),
  intensity_default numeric(4, 3) not null default 0.7 check (intensity_default >= 0 and intensity_default <= 1),
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_presets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  base_preset_id uuid references public.presets (id) on delete set null,
  name text not null check (char_length(name) >= 2 and char_length(name) <= 80),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  bucket text not null,
  path text not null,
  mime_type text,
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  bytes integer check (bytes is null or bytes >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket, path)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'Untitled Project' check (char_length(title) <= 120),
  status text not null default 'draft' check (status in ('draft', 'editing', 'ready', 'published')),
  cover_asset_id uuid references public.media_assets (id) on delete set null,
  last_preset_id uuid references public.user_presets (id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_edits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version integer not null default 1 check (version > 0),
  edit_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  caption text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete restrict,
  position integer not null check (position > 0),
  unique (post_id, position),
  unique (post_id, asset_id)
);

create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.bookmarks (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_presets_updated_at on public.user_presets;
create trigger trg_user_presets_updated_at
before update on public.user_presets
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_posts_updated_at on public.posts;
create trigger trg_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_handle text;
  safe_handle text;
begin
  base_handle := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(split_part(new.email, '@', 1), ''),
    'filmedme_user'
  );

  safe_handle := lower(regexp_replace(base_handle, '[^a-zA-Z0-9_]+', '', 'g'));
  if safe_handle = '' then
    safe_handle := 'filmedme_user';
  end if;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    safe_handle || '_' || right(replace(new.id::text, '-', ''), 6),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), safe_handle)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.publish_project_post(
  p_project_id uuid,
  p_asset_ids uuid[],
  p_caption text default '',
  p_visibility text default 'public'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_id uuid;
  v_owner uuid := auth.uid();
  v_asset uuid;
  v_position integer := 1;
begin
  if v_owner is null then
    raise exception 'Authentication required';
  end if;

  if p_visibility not in ('public', 'followers', 'private') then
    raise exception 'Invalid visibility value';
  end if;

  if array_length(p_asset_ids, 1) is null then
    raise exception 'At least one asset is required';
  end if;

  perform 1
  from public.projects p
  where p.id = p_project_id and p.owner_id = v_owner and p.is_archived = false;
  if not found then
    raise exception 'Project not found or not owned by user';
  end if;

  insert into public.posts (owner_id, project_id, caption, visibility, published_at)
  values (v_owner, p_project_id, coalesce(p_caption, ''), p_visibility, timezone('utc', now()))
  returning id into v_post_id;

  foreach v_asset in array p_asset_ids loop
    perform 1 from public.media_assets a where a.id = v_asset and a.owner_id = v_owner;
    if not found then
      raise exception 'Asset % is missing or not owned by user', v_asset;
    end if;

    insert into public.post_items (post_id, asset_id, position)
    values (v_post_id, v_asset, v_position);

    v_position := v_position + 1;
  end loop;

  update public.projects
  set status = 'published'
  where id = p_project_id;

  return v_post_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.presets enable row level security;
alter table public.user_presets enable row level security;
alter table public.media_assets enable row level security;
alter table public.projects enable row level security;
alter table public.project_edits enable row level security;
alter table public.posts enable row level security;
alter table public.post_items enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
on public.profiles
for select
using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "presets_select_all" on public.presets;
create policy "presets_select_all"
on public.presets
for select
using (true);

drop policy if exists "user_presets_owner_select" on public.user_presets;
create policy "user_presets_owner_select"
on public.user_presets
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "user_presets_owner_insert" on public.user_presets;
create policy "user_presets_owner_insert"
on public.user_presets
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "user_presets_owner_update" on public.user_presets;
create policy "user_presets_owner_update"
on public.user_presets
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "user_presets_owner_delete" on public.user_presets;
create policy "user_presets_owner_delete"
on public.user_presets
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "media_assets_owner_select" on public.media_assets;
create policy "media_assets_owner_select"
on public.media_assets
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "media_assets_owner_insert" on public.media_assets;
create policy "media_assets_owner_insert"
on public.media_assets
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "media_assets_owner_update" on public.media_assets;
create policy "media_assets_owner_update"
on public.media_assets
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "media_assets_owner_delete" on public.media_assets;
create policy "media_assets_owner_delete"
on public.media_assets
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "projects_owner_select" on public.projects;
create policy "projects_owner_select"
on public.projects
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "projects_owner_insert" on public.projects;
create policy "projects_owner_insert"
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "projects_owner_update" on public.projects;
create policy "projects_owner_update"
on public.projects
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "projects_owner_delete" on public.projects;
create policy "projects_owner_delete"
on public.projects
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "project_edits_owner_select" on public.project_edits;
create policy "project_edits_owner_select"
on public.project_edits
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_edits_owner_insert" on public.project_edits;
create policy "project_edits_owner_insert"
on public.project_edits
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_edits_owner_update" on public.project_edits;
create policy "project_edits_owner_update"
on public.project_edits
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "project_edits_owner_delete" on public.project_edits;
create policy "project_edits_owner_delete"
on public.project_edits
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "posts_select_visible" on public.posts;
create policy "posts_select_visible"
on public.posts
for select
to authenticated, anon
using (
  visibility = 'public'
  or owner_id = auth.uid()
  or (
    visibility = 'followers'
    and exists (
      select 1
      from public.follows f
      where f.followee_id = owner_id and f.follower_id = auth.uid()
    )
  )
);

drop policy if exists "posts_owner_insert" on public.posts;
create policy "posts_owner_insert"
on public.posts
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "posts_owner_update" on public.posts;
create policy "posts_owner_update"
on public.posts
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "posts_owner_delete" on public.posts;
create policy "posts_owner_delete"
on public.posts
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "post_items_select_visible" on public.post_items;
create policy "post_items_select_visible"
on public.post_items
for select
to authenticated, anon
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.visibility = 'public'
        or p.owner_id = auth.uid()
        or (
          p.visibility = 'followers'
          and exists (
            select 1
            from public.follows f
            where f.followee_id = p.owner_id and f.follower_id = auth.uid()
          )
        )
      )
  )
);

drop policy if exists "post_items_owner_insert" on public.post_items;
create policy "post_items_owner_insert"
on public.post_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.posts p
    where p.id = post_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "post_items_owner_update" on public.post_items;
create policy "post_items_owner_update"
on public.post_items
for update
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.posts p
    where p.id = post_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "post_items_owner_delete" on public.post_items;
create policy "post_items_owner_delete"
on public.post_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.id = post_id and p.owner_id = auth.uid()
  )
);

drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all"
on public.likes
for select
using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self"
on public.likes
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.visibility = 'public'
        or p.owner_id = auth.uid()
        or (
          p.visibility = 'followers'
          and exists (
            select 1
            from public.follows f
            where f.followee_id = p.owner_id and f.follower_id = auth.uid()
          )
        )
      )
  )
);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self"
on public.likes
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "bookmarks_owner_select" on public.bookmarks;
create policy "bookmarks_owner_select"
on public.bookmarks
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "bookmarks_owner_insert" on public.bookmarks;
create policy "bookmarks_owner_insert"
on public.bookmarks
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "bookmarks_owner_delete" on public.bookmarks;
create policy "bookmarks_owner_delete"
on public.bookmarks
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all"
on public.follows
for select
using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self"
on public.follows
for insert
to authenticated
with check (follower_id = auth.uid() and follower_id <> followee_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self"
on public.follows
for delete
to authenticated
using (follower_id = auth.uid());

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('originals', 'originals', false),
  ('exports', 'exports', false),
  ('videos', 'videos', false),
  ('temp', 'temp', false)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
to authenticated, anon
using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "private_media_owner_read" on storage.objects;
create policy "private_media_owner_read"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('originals', 'exports', 'videos', 'temp')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "private_media_owner_insert" on storage.objects;
create policy "private_media_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('originals', 'exports', 'videos', 'temp')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "private_media_owner_update" on storage.objects;
create policy "private_media_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('originals', 'exports', 'videos', 'temp')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('originals', 'exports', 'videos', 'temp')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "private_media_owner_delete" on storage.objects;
create policy "private_media_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('originals', 'exports', 'videos', 'temp')
  and (storage.foldername(name))[1] = auth.uid()::text
);

grant execute on function public.publish_project_post(uuid, uuid[], text, text) to authenticated;

commit;
