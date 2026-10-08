import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function handleKeepalive(req: Request) {
  const startTime = Date.now();

  // Verify CRON_SECRET in environment
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && expectedSecret.trim()) {
    const authHeader = req.headers.get("authorization");
    const cronKeyHeader = req.headers.get("x-cron-key");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (bearerToken !== expectedSecret && cronKeyHeader !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid keepalive secret" },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized: CRON_SECRET must be configured in production" },
      { status: 401 }
    );
  }

  try {
    // Touch database: query 1 to wake up Turso LibSQL database connection
    await db.$queryRawUnsafe("SELECT 1;");
    const userCount = await db.user.count();

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      status: "ok",
      message: "Turso database keepalive ping successful",
      database:
        process.env.TURSO_DATABASE_URL ||
        process.env.DATABASE_URL?.startsWith("libsql://")
          ? "turso-libsql"
          : "local-sqlite",
      userCount,
      durationMs: `${durationMs}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Keepalive Error]:", errMsg);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to ping database",
        error: errMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleKeepalive(req);
}

export async function POST(req: Request) {
  return handleKeepalive(req);
}
