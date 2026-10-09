import { NextResponse } from "next/server";
import { getCurrentUser, ensureDefaultUser } from "@/lib/auth";
import { db } from "@/lib/db";
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

async function resolveWidgetUser(req: Request) {
  return await getCurrentUser(req);
}

export async function GET(req: Request) {
  try {
    const user = await resolveWidgetUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu di widget." },
        { status: 401, headers: corsHeaders }
      );
    }

    const categories = await getCategories(user.id);
    return NextResponse.json(
      {
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengambil kategori widget.";
    console.error("GET /api/widget/categories error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveWidgetUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Silakan login terlebih dahulu di widget." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori tidak boleh kosong." },
        { status: 400, headers: corsHeaders }
      );
    }

    const category = await createCategory(user.id, body.name.trim());
    return NextResponse.json({ category }, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal membuat kategori baru.";
    console.error("POST /api/widget/categories error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500, headers: corsHeaders });
  }
}
