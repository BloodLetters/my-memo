import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/services/taskService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const task = await getTaskById(user.id, id);

    if (!task) {
      return NextResponse.json({ error: "Tugas tidak ditemukan." }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json({ task }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data tugas." }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateTask(user.id, id, body);
    return NextResponse.json({ task: updated }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal memperbarui tugas.";
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { id } = await params;
    await deleteTask(user.id, id);

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal menghapus tugas.";
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500, headers: corsHeaders }
    );
  }
}
