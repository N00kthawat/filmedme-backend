import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({
    message: "Internal server error",
    ...(env.NODE_ENV !== "production" && { detail: String(error) }),
  });
}
