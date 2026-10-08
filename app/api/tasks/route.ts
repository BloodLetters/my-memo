import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTasks, createTask, TaskFilterOptions } from "@/services/taskService";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const category = searchParams.get("category") || undefined;
    const isArchivedParam = searchParams.get("isArchived");
    const rawSortBy = searchParams.get("sortBy");
    const sortBy = (rawSortBy === "deadline" || rawSortBy === "priority" || rawSortBy === "order" || rawSortBy === "createdAt")
      ? (rawSortBy as TaskFilterOptions["sortBy"])
      : undefined;
    const rawSortOrder = searchParams.get("sortOrder");
    const sortOrder = (rawSortOrder === "asc" || rawSortOrder === "desc")
      ? (rawSortOrder as TaskFilterOptions["sortOrder"])
      : undefined;

    let isArchived: boolean | undefined = undefined;
    if (isArchivedParam !== null) {
      isArchived = isArchivedParam === "true";
    }

    const tasks = await getTasks(user.id, {
      search,
      priority,
      category,
      isArchived,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ tasks });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal mengambil daftar tugas.";
    console.error("GET /api/tasks error:", error);
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

    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { error: "Judul tugas tidak boleh kosong." },
        { status: 400 }
      );
    }

    const newTask = await createTask(user.id, {
      title: body.title,
      description: body.description,
      status: body.status || "TODO",
      priority: body.priority || "MEDIUM",
      category: body.category || "Umum",
      imageUrl: body.imageUrl || null,
      deadline: body.deadline || null,
      tags: body.tags || [],
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Gagal menambahkan tugas baru.";
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
