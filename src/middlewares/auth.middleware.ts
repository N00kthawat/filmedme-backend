import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

type JwtPayload = {
  sub: string;
  email: string;
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
