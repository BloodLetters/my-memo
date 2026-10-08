"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BoardCategoryItem,
  TaskItem,
  TaskPriority,
  UserItem,
} from "@/lib/types";
import Navbar from "./Navbar";
import Board from "./Board";
import AiSidebar from "./AiSidebar";
import ArchiveModal from "./ArchiveModal";
import TaskModal from "./TaskModal";
import { ListTodo } from "lucide-react";

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

interface BoardViewProps {
  user: UserItem;
  initialTasks: TaskItem[];
  initialCategories: BoardCategoryItem[];
  initialArchiveCount: number;
}

export default function BoardView({
  user,
  initialTasks,
  initialCategories,
  initialArchiveCount,
}: BoardViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [categories, setCategories] = useState<BoardCategoryItem[]>(initialCategories);
  const [archiveCount, setArchiveCount] = useState(initialArchiveCount);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("order"); // "order" | "deadline" | "priority"

  // AI Sidebar closed on mobile by default, opened on desktop (>= 768px)
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsAiSidebarOpen(true);
    }
  }, []);

  // Archive modal state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [initialCategoryForNew, setInitialCategoryForNew] = useState<string>("");

  // Refresh tasks and categories from API
  const refreshAll = useCallback(async () => {
    try {
      const [tasksRes, catsRes, archiveRes] = await Promise.all([
        fetch("/api/tasks?isArchived=false"),
        fetch("/api/categories"),
        fetch("/api/tasks?isArchived=true"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        setCategories(data.categories || []);
      }
      if (archiveRes.ok) {
        const data = await archiveRes.json();
        setArchiveCount((data.tasks || []).length);
      }
    } catch (err) {
      console.error("Error refreshing board data:", err);
    }
  }, []);

  const availableCategoryNames = useMemo(() => {
    return categories.map((c) => c.name);
  }, [categories]);

  // Filtered & Sorted active tasks
  const processedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.isArchived) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = t.title.toLowerCase().includes(q);
          const matchesDesc = (t.description || "").toLowerCase().includes(q);
          const matchesCategory = (t.category || "").toLowerCase().includes(q);
          const matchesTags = (t.tags || []).some((tag) =>
            tag.toLowerCase().includes(q)
          );
          if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesTags) {
            return false;
          }
        }

        // Priority filter
        if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== "ALL" && t.category !== categoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "priority") {
          return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        }
        return a.order - b.order;
      });
  }, [tasks, searchQuery, priorityFilter, categoryFilter, sortBy]);

  // Handlers for Categories
  const handleAddCategory = async (name: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data.category]);
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleRenameCategory = async (categoryId: string, newName: string) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error("Failed to rename category:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        refreshAll();
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  // Handlers for Tasks
  const handleOpenQuickAdd = (categoryName: string) => {
    setInitialCategoryForNew(categoryName);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      refreshAll();
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setArchiveCount((c) => c + 1);

      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
    } catch (err) {
      console.error("Failed to archive task:", err);
      refreshAll();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors">
      
      {/* Sticky Full-Width Navbar */}
      <Navbar
        username={user.username}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        availableCategories={availableCategoryNames}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        archiveCount={archiveCount}
        onOpenArchive={() => setIsArchiveOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
        onOpenCreateModal={() => {
          setEditingTask(null);
          setInitialCategoryForNew(categories[0]?.name || "Umum");
          setIsTaskModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Container: AI Sidebar on Left + Custom Board on Right */}
      <div className="flex-1 w-full flex overflow-hidden min-h-0">
        
        {/* Left-side AI Assistant Panel */}
        <AiSidebar
          categories={categories}
          onTaskCreated={refreshAll}
          isOpen={isAiSidebarOpen}
          onToggle={() => setIsAiSidebarOpen(!isAiSidebarOpen)}
        />

        {/* Board View Area */}
        <main className="flex-1 flex flex-col px-3 sm:px-6 pt-2.5 sm:pt-4 pb-3 sm:pb-5 overflow-hidden min-h-0">
          
          {/* Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-2.5 sm:mb-3.5 shrink-0">
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Custom Task Board
              </h1>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Kategori dibuat bebas oleh Anda. Drag & drop kartu antar kategori kapan saja.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 shadow-2xs">
                <ListTodo className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 dark:text-zinc-500" />
                <span>Total: <strong className="text-zinc-900 dark:text-zinc-100">{processedTasks.length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 shadow-2xs">
                <span>Kolom: <strong className="text-zinc-900 dark:text-zinc-100">{categories.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Filter Indicator Banner */}
          {(searchQuery || priorityFilter !== "ALL" || categoryFilter !== "ALL") && (
            <div className="mb-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-zinc-700 dark:text-zinc-200 text-[11px] sm:text-xs">Filter aktif:</span>
                {searchQuery && (
                  <span className="bg-white dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px]">
                    &quot;{searchQuery}&quot;
                  </span>
                )}
                {priorityFilter !== "ALL" && (
                  <span className="bg-white dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px]">
                    Prioritas: {priorityFilter}
                  </span>
                )}
                {categoryFilter !== "ALL" && (
                  <span className="bg-white dark:bg-zinc-800 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px]">
                    Kategori: {categoryFilter}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("ALL");
                  setCategoryFilter("ALL");
                }}
                className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium underline"
              >
                Reset
              </button>
            </div>
          )}

          {/* Dynamic Category Columns Board */}
          <div className="flex-1 w-full min-h-0">
            <Board
              categories={categories}
              tasks={processedTasks}
              onTasksChange={(newTasks) => setTasks(newTasks)}
              onQuickAdd={handleOpenQuickAdd}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onArchiveTask={handleArchiveTask}
              onAddCategory={handleAddCategory}
              onRenameCategory={handleRenameCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </div>

        </main>
      </div>

      {/* Archive Modal */}
      <ArchiveModal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onRestored={refreshAll}
      />

      {/* Manual Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={editingTask}
        initialCategory={initialCategoryForNew}
        categories={categories}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={refreshAll}
        onDelete={handleDeleteTask}
      />

    </div>
  );
}
