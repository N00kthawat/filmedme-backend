import { Router } from "express";

import { loginController, registerController } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
