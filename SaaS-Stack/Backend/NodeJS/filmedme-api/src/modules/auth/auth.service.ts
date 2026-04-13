import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";
import { HttpError } from "../../utils/http-error";
import {
  createUserAndProfile,
  findProfileByUserId,
  findUserWithProfileByEmail,
} from "./auth.repository";

type AuthResult = {
  token: string;
  user: {
    id: string;
    email: string;
  };
  profile: {
    handle: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
  };
};

function issueToken(params: { userId: string; email: string }) {
  const signOptions: SignOptions = {
    subject: params.userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign({ email: params.email }, env.JWT_SECRET, {
    ...signOptions,
  });
}

function deriveHandle(email: string) {
  const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  return (base || "filmedme_user").slice(0, 18);
}

export async function register(input: {
  email: string;
  password: string;
  handle?: string;
  displayName?: string;
}): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const existing = await findUserWithProfileByEmail(email);
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const handle = input.handle?.trim() || `${deriveHandle(email)}_${Date.now().toString().slice(-5)}`;
  const displayName = input.displayName?.trim() || handle;

  const { user, profile } = await createUserAndProfile({
    email,
    passwordHash,
    handle,
    displayName,
  });

  return {
    token: issueToken({ userId: user.id, email: user.email }),
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      avatarUrl: profile.avatar_url,
    },
  };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const email = input.email.toLowerCase().trim();
  const found = await findUserWithProfileByEmail(email);
  if (!found) {
    throw new HttpError(401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(input.password, found.password_hash);
  if (!isValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    token: issueToken({ userId: found.id, email: found.email }),
    user: {
      id: found.id,
      email: found.email,
    },
    profile: {
      handle: found.handle,
      displayName: found.display_name,
      bio: found.bio,
      avatarUrl: found.avatar_url,
    },
  };
}

export async function getCurrentProfile(userId: string) {
  const profile = await findProfileByUserId(userId);
  if (!profile) {
    throw new HttpError(404, "Profile not found");
  }
  return profile;
}
