# Bruno Collection

Collection path:

- `/Users/nookthawat/Project/filmedme-backend/bruno/filmedme-api`

## How to use

1. Start backend server from `/Users/nookthawat/Project/filmedme-backend`:
   - `npm run dev`
2. Open Bruno and choose `Open Collection`
3. Select this folder: `bruno/filmedme-api`
4. Select environment: `local`
5. Run requests in this order:
   - `Auth/Register`
   - `Auth/Login` (stores `authToken`)
   - set `uploadFilePath` in environment to a real local image/video path
   - `Files/Upload File` (stores `fileId`)
   - protected routes (`Profiles`, `Projects`, `Recipes`, `Posts`)

## Important variables

- `authToken` is set by `Auth/Login`
- `projectId` is set by `Projects/Create Project`
- `fileId` is set by `Files/Upload File`
- `uploadFilePath` must point to a real local file before running upload request
