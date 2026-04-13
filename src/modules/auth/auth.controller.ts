import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/async-handler";
import { loginSchema, registerSchema } from "./auth.schemas";
import { login, register } from "./auth.service";

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);
  const result = await register(payload);
  res.status(201).json(result);
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await login(payload);
  res.status(200).json(result);
});
