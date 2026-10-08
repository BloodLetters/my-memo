import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const cleanUsername = username?.trim().toLowerCase();
    if (!cleanUsername || !password || password.length < 4) {
      return NextResponse.json(
        { error: "Username wajib diisi dan password minimal 4 karakter." },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username sudah terdaftar. Silakan gunakan username lain." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
      },
    });

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat pendaftaran akun." },
      { status: 500 }
    );
  }
}
