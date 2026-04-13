import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

import { env } from "../../config/env";
import { requireAuth } from "../../middlewares/auth.middleware";
import { listMyFilesController, uploadFileController } from "./files.controller";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user?.id ?? "anonymous";
    const absoluteDir = path.resolve(process.cwd(), env.UPLOAD_DIR, userId);
    fs.mkdirSync(absoluteDir, { recursive: true });
    cb(null, absoluteDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

export const fileRouter = Router();

fileRouter.get("/mine", requireAuth, listMyFilesController);
fileRouter.post("/upload", requireAuth, upload.single("file"), uploadFileController);
