import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateCategory, deleteCategory } from "@/services/taskService";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const updated = await updateCategory(user.id, id, name.trim());
    return NextResponse.json({ category: updated });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengubah kategori.";
    console.error("PATCH /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteCategory(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal menghapus kategori.";
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
