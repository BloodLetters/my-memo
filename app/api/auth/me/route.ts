import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401, headers: corsHeaders });
    }
    return NextResponse.json({ user }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ user: null }, { status: 500, headers: corsHeaders });
  }
}
