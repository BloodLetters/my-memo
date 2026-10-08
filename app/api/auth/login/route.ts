import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, ensureDefaultUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await ensureDefaultUser();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Check user with exact case or lower case
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: cleanUsername.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(String(password).trim(), user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan pada server saat login.";
    console.error("Login error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
