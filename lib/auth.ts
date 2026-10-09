import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const SESSION_COOKIE_NAME = "mymemo_session";
// 10 years in seconds (effectively unlimited for local personal use)
export const UNLIMITED_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  
  await db.session.create({
    data: {
      token,
      userId,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UNLIMITED_MAX_AGE,
  });

  return token;
}

export async function getCurrentUser(req?: Request) {
  try {
    let token: string | undefined;

    // 1. Check Authorization header or x-session-token from Request (e.g. from Desktop Widget)
    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }
      if (!token) {
        token = req.headers.get("x-session-token") || undefined;
      }
    }

    // 2. Fallback to browser session cookies
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!token) {
      return null;
    }

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session || !session.user) {
      return null;
    }

    return session.user;
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await db.session.deleteMany({
        where: { token },
      });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error: unknown) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("Error destroying session:", error);
  }
}

export async function ensureDefaultUser() {
  const userCount = await db.user.count();
  if (userCount === 0) {
    const defaultUsername = process.env.DEFAULT_USERNAME || "admin";
    const defaultPassword = process.env.DEFAULT_PASSWORD || "admin123";
    const passwordHash = await hashPassword(defaultPassword);
    await db.user.create({
      data: {
        username: defaultUsername,
        passwordHash,
      },
    });
    console.log(`Created initial default user: username '${defaultUsername}'`);
  }
}
