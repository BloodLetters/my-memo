import { redirect } from "next/navigation";
import { getCurrentUser, ensureDefaultUser } from "@/lib/auth";
import { getTasks, getCategories, createTask } from "@/services/taskService";
import BoardView from "@/components/BoardView";

export default async function HomePage() {
  await ensureDefaultUser();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch categories and tasks for this user
  let categories = await getCategories(user.id);
  let tasks = await getTasks(user.id, { isArchived: false });
  const archivedTasks = await getTasks(user.id, { isArchived: true });

  // If user has 0 tasks, seed initial demonstration tasks into their categories
  if (tasks.length === 0 && archivedTasks.length === 0 && categories.length > 0) {
    const cat1 = categories[0]?.name || "Tugas Kuliah";
    const cat2 = categories[1]?.name || "Tugas Pribadi";
    const cat3 = categories[2]?.name || "Pekerjaan";

    await createTask(user.id, {
      title: "Membuat ERD Database Sistem Informasi",
      description: "Diagram entitas relasi tugas basis data bab 4.",
      priority: "HIGH",
      category: cat1,
      deadline: new Date(Date.now() + 86400000).toISOString(),
      tags: ["database", "ERD", "kuliah"],
      order: 0,
    });

    await createTask(user.id, {
      title: "Beli Kebutuhan Bulanan & Buku Referensi",
      description: "Buku algoritma & pemrograman dan binder catatan.",
      priority: "LOW",
      category: cat2,
      deadline: new Date(Date.now() + 172800000).toISOString(),
      tags: ["pribadi", "belanja"],
      order: 0,
    });

    await createTask(user.id, {
      title: "Review Pull Request Landing Page Tailwind CSS",
      description: "Periksa responsivitas dan komponen board.",
      priority: "URGENT",
      category: cat3,
      deadline: new Date().toISOString(),
      tags: ["work", "frontend"],
      order: 0,
    });

    tasks = await getTasks(user.id, { isArchived: false });
  }

  return (
    <BoardView
      user={{ id: user.id, username: user.username }}
      initialTasks={tasks}
      initialCategories={categories}
      initialArchiveCount={archivedTasks.length}
    />
  );
}
