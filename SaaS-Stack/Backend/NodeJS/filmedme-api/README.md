# Filmedme API (Node.js + TypeScript)

This is the active backend implementation for Filmedme.

## Tech

- Runtime: Node.js
- Framework: Express
- Language: TypeScript
- Database: PostgreSQL
- Auth: JWT + bcrypt
- File flow: local upload (`multer`) + metadata in PostgreSQL

## Setup

```bash
cd /Users/nookthawat/Project/filmedme-backend/SaaS-Stack/Backend/NodeJS/filmedme-api
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Server starts at `http://localhost:4000`.

## Main API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profiles/me`
- `PATCH /api/profiles/me`
- `POST /api/files/upload`
- `GET /api/files/mine`
- `POST /api/projects`
- `GET /api/projects`
- `PATCH /api/projects/:projectId`
- `POST /api/recipes`
- `GET /api/recipes`
- `POST /api/posts/publish`
- `GET /api/posts/feed`

## Notes

- This backend does not use Supabase Edge Functions.
- Existing `supabase/` folder is now optional reference, not the active API runtime.
