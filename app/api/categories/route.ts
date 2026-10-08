import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, createCategory } from "@/services/taskService";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await getCategories(user.id);
    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengambil daftar kategori.";
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const category = await createCategory(user.id, name.trim());
    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal membuat kategori baru.";
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
