"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Plus, Check, X, FolderPlus } from "lucide-react";
import { BoardCategoryItem, TaskItem } from "@/lib/types";
import Column from "./Column";

interface BoardProps {
  categories: BoardCategoryItem[];
  tasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
  onQuickAdd: (categoryName: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onAddCategory: (name: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function Board({
  categories,
  tasks,
  onTasksChange,
  onQuickAdd,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: BoardProps) {
  const [mounted, setMounted] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const getCategoryTasks = (categoryName: string) => {
    return tasks
      .filter((t) => t.category === categoryName && !t.isArchived)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCategory = source.droppableId;
    const destCategory = destination.droppableId;

    const currentTasks = [...tasks];
    const movedTaskIndex = currentTasks.findIndex((t) => t.id === draggableId);
    if (movedTaskIndex === -1) return;

    const movedTask = { ...currentTasks[movedTaskIndex] };

    // Separate tasks by category
    let sourceColTasks = currentTasks
      .filter((t) => t.category === sourceCategory && t.id !== draggableId)
      .sort((a, b) => a.order - b.order);

    let destColTasks =
      sourceCategory === destCategory
        ? sourceColTasks
        : currentTasks
            .filter((t) => t.category === destCategory && t.id !== draggableId)
            .sort((a, b) => a.order - b.order);

    // Insert task into destination array at destination.index
    movedTask.category = destCategory;
    destColTasks.splice(destination.index, 0, movedTask);

    // Re-index orders for destination column
    const reorderedDest = destColTasks.map((t, idx) => ({
      ...t,
      order: idx * 10,
    }));

    // If different column, also re-index source column
    let reorderedSource: TaskItem[] = [];
    if (sourceCategory !== destCategory) {
      reorderedSource = sourceColTasks.map((t, idx) => ({
        ...t,
        order: idx * 10,
      }));
    }

    // Build new full task list optimistically
    const untouchedTasks = currentTasks.filter(
      (t) => t.category !== sourceCategory && t.category !== destCategory
    );

    const updatedTasks = [
      ...untouchedTasks,
      ...(sourceCategory !== destCategory ? reorderedSource : []),
      ...reorderedDest,
    ];

    onTasksChange(updatedTasks);

    // Send batch reorder to SQLite API
    const itemsToUpdate = [
      ...(sourceCategory !== destCategory ? reorderedSource : []),
      ...reorderedDest,
    ].map((t) => ({
      id: t.id,
      category: t.category,
      order: t.order,
    }));

    try {
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToUpdate }),
      });
    } catch (err) {
      console.error("Failed to persist task reordering:", err);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex gap-3 sm:gap-5 h-full w-full min-h-0 overflow-x-auto pb-2 snap-x snap-mandatory animate-pulse">
        {categories.map((col) => (
          <div
            key={col.id}
            className="w-[84vw] sm:w-80 max-w-[340px] h-full bg-zinc-100/70 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 shrink-0 snap-center sm:snap-start"
          />
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 sm:gap-5 h-full w-full min-h-0 overflow-x-auto pb-2 items-stretch snap-x snap-mandatory scroll-smooth px-0.5 sm:px-1">
        {categories.map((cat) => (
          <Column
            key={cat.id}
            category={cat}
            tasks={getCategoryTasks(cat.name)}
            onQuickAdd={onQuickAdd}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onArchiveTask={onArchiveTask}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />
        ))}

        {/* Add Category Column Card */}
        <div className="w-[84vw] sm:w-72 max-w-[280px] shrink-0 snap-center sm:snap-start">
          {isAddingCategory ? (
            <form
              onSubmit={handleCreateCategory}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs space-y-2.5 animate-in fade-in zoom-in-95"
            >
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Tambah Kategori Baru
              </h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Proyek Web, Skripsi..."
                className="w-full text-xs px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="py-1.5 px-3 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCategory(true)}
              className="w-full h-24 border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 transition-colors group text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <FolderPlus className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 mb-1 transition-colors" />
              <span className="text-xs font-semibold">
                + Tambah Kategori
              </span>
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}
