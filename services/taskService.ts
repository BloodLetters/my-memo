import { db } from "@/lib/db";
import { BoardCategoryItem, TaskItem, TaskPriority } from "@/lib/types";

export interface TaskFilterOptions {
  search?: string;
  priority?: string;
  category?: string;
  status?: string;
  isArchived?: boolean;
  sortBy?: "deadline" | "priority" | "order" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  category: string;
  imageUrl?: string | null;
  deadline?: string | null;
  tags?: string[];
  order?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  category?: string;
  imageUrl?: string | null;
  deadline?: string | null;
  tags?: string[];
  order?: number;
  isArchived?: boolean;
}

/* =========================================================
   CATEGORY MANAGEMENT
========================================================= */

export async function getCategories(userId: string): Promise<BoardCategoryItem[]> {
  let categories = await db.boardCategory.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  // Seed initial user-defined categories if empty
  if (categories.length === 0) {
    const defaults = ["Tugas Kuliah", "Tugas Pribadi", "Pekerjaan"];
    await db.$transaction(
      defaults.map((name, index) =>
        db.boardCategory.create({
          data: {
            name,
            order: index * 10,
            userId,
          },
        })
      )
    );

    categories = await db.boardCategory.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    });
  }

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    order: c.order,
    color: c.color || "zinc",
  }));
}

export async function createCategory(userId: string, name: string): Promise<BoardCategoryItem> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Nama kategori tidak boleh kosong");

  const existing = await db.boardCategory.findUnique({
    where: {
      userId_name: {
        userId,
        name: cleanName,
      },
    },
  });

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      order: existing.order,
      color: existing.color || "zinc",
    };
  }

  const last = await db.boardCategory.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const newOrder = last ? last.order + 10 : 0;

  const created = await db.boardCategory.create({
    data: {
      name: cleanName,
      order: newOrder,
      userId,
    },
  });

  return {
    id: created.id,
    name: created.name,
    order: created.order,
    color: created.color || "zinc",
  };
}

export async function updateCategory(userId: string, categoryId: string, newName: string) {
  const cleanName = newName.trim();
  if (!cleanName) throw new Error("Nama kategori tidak boleh kosong");

  const existing = await db.boardCategory.findFirst({
    where: { id: categoryId, userId },
  });

  if (!existing) throw new Error("Kategori tidak ditemukan");

  const oldName = existing.name;

  return await db.$transaction(async (tx) => {
    const updated = await tx.boardCategory.update({
      where: { id: categoryId },
      data: { name: cleanName },
    });

    // Update tasks that have the old category name
    await tx.task.updateMany({
      where: { userId, category: oldName },
      data: { category: cleanName },
    });

    return updated;
  });
}

export async function deleteCategory(userId: string, categoryId: string) {
  const existing = await db.boardCategory.findFirst({
    where: { id: categoryId, userId },
  });

  if (!existing) throw new Error("Kategori tidak ditemukan");

  return await db.$transaction(async (tx) => {
    // Delete all tasks in this category
    await tx.task.deleteMany({
      where: { userId, category: existing.name },
    });

    // Delete category
    return await tx.boardCategory.delete({
      where: { id: categoryId },
    });
  });
}

/* =========================================================
   TASK MANAGEMENT
========================================================= */

export async function getTasks(
  userId: string,
  options: TaskFilterOptions = {}
): Promise<TaskItem[]> {
  const where: any = { userId };

  // By default, filter out archived tasks unless isArchived is explicitly true
  if (options.isArchived !== undefined) {
    where.isArchived = options.isArchived;
  } else {
    where.isArchived = false;
  }

  if (options.priority && options.priority !== "ALL") {
    where.priority = options.priority;
  }

  if (options.category && options.category !== "ALL") {
    where.category = options.category;
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { category: { contains: q } },
      {
        taskTags: {
          some: {
            tag: {
              name: { contains: q },
            },
          },
        },
      },
    ];
  }

  let orderBy: any = [{ order: "asc" }, { createdAt: "desc" }];

  if (options.sortBy === "deadline") {
    orderBy = [{ deadline: options.sortOrder || "asc" }, { order: "asc" }];
  } else if (options.sortBy === "priority") {
    orderBy = [{ priority: options.sortOrder || "desc" }, { order: "asc" }];
  }

  const tasks = await db.task.findMany({
    where,
    orderBy,
    include: {
      taskTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority as TaskPriority,
    category: t.category,
    imageUrl: t.imageUrl,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    order: t.order,
    isArchived: t.isArchived,
    archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    tags: t.taskTags.map((tt) => tt.tag.name),
  }));
}

export async function getTaskById(
  userId: string,
  taskId: string
): Promise<TaskItem | null> {
  const t = await db.task.findFirst({
    where: { id: taskId, userId },
    include: {
      taskTags: {
        include: {
          tag: true,
        },
      },
    },
  });

  if (!t) return null;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority as TaskPriority,
    category: t.category,
    imageUrl: t.imageUrl,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    order: t.order,
    isArchived: t.isArchived,
    archivedAt: t.archivedAt ? t.archivedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    tags: t.taskTags.map((tt) => tt.tag.name),
  };
}

export async function createTask(userId: string, data: CreateTaskInput) {
  const category = data.category?.trim() || "Umum";

  // Ensure category exists in user board categories
  try {
    await createCategory(userId, category);
  } catch {
    // ignore if already exists
  }

  // Find highest current order in this category
  const lastTask = await db.task.findFirst({
    where: { userId, category },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const newOrder = data.order ?? (lastTask ? lastTask.order + 10 : 0);
  const deadlineDate = data.deadline ? new Date(data.deadline) : null;

  return await db.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        category,
        imageUrl: data.imageUrl || null,
        deadline: deadlineDate,
        order: newOrder,
        isArchived: false,
        userId,
      },
    });

    if (data.tags && data.tags.length > 0) {
      for (const rawTag of data.tags) {
        const tagName = rawTag.trim();
        if (!tagName) continue;

        let tag = await tx.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await tx.tag.create({
            data: { name: tagName },
          });
        }

        await tx.taskTag.create({
          data: {
            taskId: task.id,
            tagId: tag.id,
          },
        });
      }
    }

    return task;
  });
}

export async function updateTask(userId: string, taskId: string, data: UpdateTaskInput) {
  const existing = await db.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) throw new Error("Task not found");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.category !== undefined) {
    updateData.category = data.category.trim();
    // ensure category exists
    await createCategory(userId, updateData.category).catch(() => {});
  }
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  }
  if (data.isArchived !== undefined) {
    updateData.isArchived = data.isArchived;
    updateData.archivedAt = data.isArchived ? new Date() : null;
  }

  return await db.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: updateData,
    });

    if (data.tags !== undefined) {
      await tx.taskTag.deleteMany({
        where: { taskId },
      });

      for (const rawTag of data.tags) {
        const tagName = rawTag.trim();
        if (!tagName) continue;

        let tag = await tx.tag.findUnique({
          where: { name: tagName },
        });

        if (!tag) {
          tag = await tx.tag.create({
            data: { name: tagName },
          });
        }

        await tx.taskTag.create({
          data: {
            taskId: taskId,
            tagId: tag.id,
          },
        });
      }
    }

    return updated;
  });
}

export async function setTaskArchive(userId: string, taskId: string, isArchived: boolean) {
  return await updateTask(userId, taskId, { isArchived });
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await db.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) throw new Error("Task not found");

  return await db.task.delete({
    where: { id: taskId },
  });
}

export async function batchReorderTasks(
  userId: string,
  items: { id: string; category: string; order: number }[]
) {
  return await db.$transaction(
    items.map((item) =>
      db.task.updateMany({
        where: { id: item.id, userId },
        data: {
          category: item.category,
          order: item.order,
        },
      })
    )
  );
}
