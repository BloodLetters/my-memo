import { NextResponse } from "next/server";
import { getCurrentUser, ensureDefaultUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCategories, createCategory } from "@/services/taskService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function resolveWidgetUser() {
  const user = await getCurrentUser();
  if (user) return user;

  let localUser = await db.user.findFirst({
    select: { id: true, username: true, createdAt: true },
  });

  if (!localUser) {
    await ensureDefaultUser();
    localUser = await db.user.findFirst({
      select: { id: true, username: true, createdAt: true },
    });
  }

  return localUser;
}

export async function GET() {
  try {
    const user = await resolveWidgetUser();
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404, headers: corsHeaders }
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
    const user = await resolveWidgetUser();
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404, headers: corsHeaders }
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
