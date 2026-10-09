import { NextResponse } from "next/server";
import { getCurrentUser, ensureDefaultUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTasks, updateTask, createTask, getCategories } from "@/services/taskService";
import { TaskPriority } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

async function resolveWidgetUser() {
  // 1. Coba dari session cookies
  const user = await getCurrentUser();
  if (user) return user;

  // 2. Fallback untuk desktop widget lokal (ambil user utama)
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

export async function GET(req: Request) {
  try {
    const user = await resolveWidgetUser();
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const category = searchParams.get("category") || undefined;

    const [tasks, archivedTasks] = await Promise.all([
      getTasks(user.id, {
        search,
        priority,
        category,
        isArchived: false,
        sortBy: "deadline",
        sortOrder: "asc",
      }),
      getTasks(user.id, {
        search,
        priority,
        category,
        isArchived: true,
        sortBy: "deadline",
        sortOrder: "asc",
      }),
    ]);

    return NextResponse.json(
      {
        tasks,
        archivedTasks,
        user: {
          id: user.id,
          username: user.username,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengambil tugas widget.";
    console.error("GET /api/widget/tasks error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await resolveWidgetUser();
    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { id, status, priority, title, isArchived } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task ID wajib disertakan." },
        { status: 400, headers: corsHeaders }
      );
    }

    const updated = await updateTask(user.id, id, {
      status,
      priority: priority as TaskPriority,
      title,
      isArchived,
    });

    return NextResponse.json({ task: updated }, { headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal update tugas widget.";
    console.error("PATCH /api/widget/tasks error:", error);
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
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Judul tugas tidak boleh kosong." },
        { status: 400, headers: corsHeaders }
      );
    }

    const newTask = await createTask(user.id, {
      title: body.title.trim(),
      description: body.description || "",
      status: body.status || "TODO",
      priority: (body.priority as TaskPriority) || "MEDIUM",
      category: body.category || "Umum",
      deadline: body.deadline || null,
      tags: body.tags || [],
    });

    return NextResponse.json({ task: newTask }, { status: 201, headers: corsHeaders });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal menambah tugas dari widget.";
    console.error("POST /api/widget/tasks error:", error);
    return NextResponse.json({ error: errMsg }, { status: 500, headers: corsHeaders });
  }
}
