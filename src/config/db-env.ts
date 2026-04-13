import { config } from "dotenv";
import { z } from "zod";

const loadedPrimary = config({ path: ".env" });
if (loadedPrimary.error) {
  config({ path: ".env.example" });
} else {
  // Fill optional defaults from example without overriding local secrets.
  config({ path: ".env.example" });
}

const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

const parsed = dbEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid database environment variables",
    parsed.error.flatten().fieldErrors,
  );
  console.error("Create .env from .env.example and set DATABASE_URL.");
  process.exit(1);
}

export const dbEnv = parsed.data;
