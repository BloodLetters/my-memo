import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, createCategory } from "@/services/taskService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const categories = await getCategories(user.id);
    return NextResponse.json({ categories }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengambil daftar kategori.";
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori tidak boleh kosong." },
        { status: 400, headers: corsHeaders }
      );
    }

    const category = await createCategory(user.id, name.trim());
    return NextResponse.json({ category }, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal membuat kategori baru.";
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}
