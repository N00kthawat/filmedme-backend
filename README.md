# Filmedme Backend

This is the separated backend project for Filmedme.

## Stack

- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Edge Functions (TypeScript on Deno runtime)

## Structure

- `SaaS-Stack/` architecture catalog (all options by domain)
- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`
- `supabase/functions/`

## Local run

From this backend project root:

```bash
supabase start
supabase db reset
supabase functions serve --env-file ./supabase/.env.local
```

## Notes

- Keep frontend and backend as separate repositories.
- Frontend app project path: `/Users/nookthawat/Project/filmedme`
- Backend project path: `/Users/nookthawat/Project/filmedme-backend`
