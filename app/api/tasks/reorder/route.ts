import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { batchReorderTasks } from "@/services/taskService";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    await batchReorderTasks(user.id, items);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memperbarui urutan tugas.";
    console.error("POST /api/tasks/reorder error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
