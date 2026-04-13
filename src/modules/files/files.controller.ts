import type { Request, Response } from "express";
import path from "node:path";

import { asyncHandler } from "../../utils/async-handler";
import { HttpError } from "../../utils/http-error";
import { createFileRecord, listMyFiles } from "./files.service";

export const uploadFileController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
  if (!req.file) {
    throw new HttpError(400, "File is required");
  }

  const kind = req.body.kind === "video" ? "video" : "image";
  const relativePath = path.posix.join(req.user.id, req.file.filename);

  const created = await createFileRecord({
    ownerId: req.user.id,
    kind,
    bucket: "uploads",
    path: relativePath,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    metadata: {
      originalName: req.file.originalname,
    },
  });

  res.status(201).json({
    file: created,
    url: `/static/uploads/${relativePath}`,
  });
});

export const listMyFilesController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Unauthorized");
  }
  const files = await listMyFiles(req.user.id);
  res.json({ files });
});
