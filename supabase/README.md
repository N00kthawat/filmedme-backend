# Supabase Backend (Filmedme)

This directory contains the initial Filmedme backend scaffold:

- `migrations/`: schema, RLS policies, storage buckets, helper SQL functions
- `seed.sql`: default system presets
- `functions/`: edge functions written in TypeScript (Deno runtime)

## Local workflow

1. Install Supabase CLI
2. Start local services:

```bash
supabase start
```

3. Apply migrations:

```bash
supabase db reset
```

4. Serve edge functions:

```bash
supabase functions serve --env-file ./supabase/.env.local
```

## Required function environment values

Set these in `supabase/.env.local` for local testing:

```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<your-local-anon-key>
```

## First functions included

- `create-profile`
- `create-project`
- `save-recipe`
- `publish-post`
