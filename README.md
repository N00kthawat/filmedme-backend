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
cd /Users/nookthawat/Project/filmedme-backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
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

## API testing with Bruno

- Collection path: `bruno/filmedme-api`
- Open Bruno > `Open Collection` > select this folder
- Choose `local` environment
- Set `uploadFilePath` in env to a real local file path for upload test
- Recommended flow: `Auth/Register` -> `Auth/Login` -> `Files/Upload File` -> other protected routes
- CLI run (optional): `npm run bruno:run`

## Notes

- This backend does not use Supabase Edge Functions.
- Existing `supabase/` folder is now optional reference, not the active API runtime.
- `npm run db:migrate` requires `DATABASE_URL` only.
- `npm run dev` requires both `DATABASE_URL` and `JWT_SECRET`.
- `npm run db:seed` creates 1 default user from `.env` (`SEED_USER_*`) and skips if email already exists.
