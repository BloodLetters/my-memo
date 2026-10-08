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

    const user = await db.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
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
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat login." },
      { status: 500 }
    );
  }
}
