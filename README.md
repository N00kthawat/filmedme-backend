# Filmedme Backend

This is the separated backend project for Filmedme.

## Stack

- Node.js + Express + TypeScript
- PostgreSQL + JWT auth + file upload flow (multer)

## Structure

- `SaaS-Stack/` architecture catalog (all options by domain)
- `SaaS-Stack/Backend/NodeJS/filmedme-api/` active backend API
- `supabase/` optional legacy reference

## Local run

From active Node API directory:

```bash
cd /Users/nookthawat/Project/filmedme-backend/SaaS-Stack/Backend/NodeJS/filmedme-api
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

## Notes

- Keep frontend and backend as separate repositories.
- Frontend app project path: `/Users/nookthawat/Project/filmedme`
- Backend project path: `/Users/nookthawat/Project/filmedme-backend`
