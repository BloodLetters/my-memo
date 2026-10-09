import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, ensureDefaultUser } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    await ensureDefaultUser();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400, headers: corsHeaders }
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
        { status: 401, headers: corsHeaders }
      );
    }

    const isValid = await verifyPassword(String(password).trim(), user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = await createSession(user.id);

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Terjadi kesalahan pada server saat login.";
    console.error("Login error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}
