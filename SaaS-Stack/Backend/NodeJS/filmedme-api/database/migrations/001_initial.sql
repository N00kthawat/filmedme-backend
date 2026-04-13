create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists profiles (
  user_id uuid primary key references app_users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-zA-Z0-9_]+$'),
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists presets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  temperature integer not null default 0,
  grain integer not null default 0 check (grain >= 0 and grain <= 100),
  intensity_default numeric(4, 3) not null default 0.7 check (intensity_default >= 0 and intensity_default <= 1),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists media_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references app_users(id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  storage_provider text not null default 'local',
  bucket text not null default 'uploads',
  path text not null,
  mime_type text,
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (bucket, path)
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references app_users(id) on delete cascade,
  title text not null default 'Untitled Project',
  status text not null default 'draft' check (status in ('draft', 'editing', 'ready', 'published')),
  cover_file_id uuid references media_files(id) on delete set null,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists project_edits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version integer not null check (version > 0),
  edit_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (project_id, version)
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references app_users(id) on delete cascade,
  name text not null check (char_length(name) >= 2 and char_length(name) <= 80),
  base_preset text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references app_users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  caption text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  file_id uuid not null references media_files(id) on delete restrict,
  position integer not null check (position > 0),
  unique (post_id, file_id),
  unique (post_id, position)
);

create table if not exists likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists bookmarks (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists follows (
  follower_id uuid not null references app_users(id) on delete cascade,
  followee_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_recipes_owner on recipes(owner_id);
create index if not exists idx_media_files_owner on media_files(owner_id);
create index if not exists idx_posts_owner on posts(owner_id);
create index if not exists idx_posts_visibility on posts(visibility, published_at desc);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
before update on projects
for each row execute function set_updated_at();

drop trigger if exists trg_recipes_updated_at on recipes;
create trigger trg_recipes_updated_at
before update on recipes
for each row execute function set_updated_at();

drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
before update on posts
for each row execute function set_updated_at();

insert into presets (code, name, description, temperature, grain, intensity_default)
values
  ('A16', 'Soft Chrome', 'Cool chrome palette with lifted blacks for night streets.', -8, 38, 0.84),
  ('M5', 'Dawn Fade', 'Warm highlights and gentle contrast for portraits.', 10, 22, 0.73),
  ('B2', 'Muted Cobalt', 'Matte blacks and muted blue shadows.', -2, 18, 0.62),
  ('S9', 'Quiet Dust', 'Editorial matte finish with dusty highlights.', 5, 31, 0.78)
on conflict (code) do nothing;
