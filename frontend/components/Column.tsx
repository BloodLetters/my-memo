"use client";

import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Plus, Edit2, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import { BoardCategoryItem, TaskItem } from "@/lib/types";
import TaskCard from "./TaskCard";

interface ColumnProps {
  category: BoardCategoryItem;
  tasks: TaskItem[];
  onQuickAdd: (categoryName: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onArchiveTask: (taskId: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function Column({
  category,
  tasks,
  onQuickAdd,
  onEditTask,
  onDeleteTask,
  onArchiveTask,
  onRenameCategory,
  onDeleteCategory,
}: ColumnProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(category.name);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSaveName = () => {
    if (nameValue.trim() && nameValue.trim() !== category.name) {
      onRenameCategory(category.id, nameValue.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-[84vw] sm:w-80 max-w-[340px] bg-zinc-100/70 dark:bg-zinc-900/80 rounded-xl p-3 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs shrink-0 snap-center sm:snap-start transition-colors">
      
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          {isEditingName ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                className="w-full text-xs font-semibold px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 truncate">
              <h3
                onClick={() => setIsEditingName(true)}
                className="text-xs font-bold text-zinc-800 dark:text-zinc-200 tracking-wider truncate cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-400"
                title="Klik untuk mengubah nama kategori"
              >
                {category.name}
              </h3>
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 rounded-full shrink-0">
                {tasks.length}
              </span>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.5 rounded text-[10px]">
              <span className="text-rose-700 dark:text-rose-300 font-medium">Hapus?</span>
              <button
                onClick={() => onDeleteCategory(category.id)}
                className="text-rose-700 dark:text-rose-300 font-bold hover:underline"
              >
                Ya
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="text-zinc-500 dark:text-zinc-400 ml-0.5 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Batal
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer touch-manipulation"
                title="Ubah nama kategori"
                aria-label="Ubah nama kategori"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              </button>

              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer touch-manipulation"
                title="Hapus kategori dan tugas di dalamnya"
                aria-label="Hapus kategori"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              </button>

              <button
                onClick={() => onQuickAdd(category.name)}
                className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer touch-manipulation"
                title={`Tambah tugas ke ${category.name}`}
                aria-label={`Tambah tugas ke ${category.name}`}
              >
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={category.name}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 rounded-lg p-1 pr-1.5 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-zinc-200/50 dark:bg-zinc-800/50 ring-1 ring-zinc-300 dark:ring-zinc-700 ring-dashed"
                : ""
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onArchive={onArchiveTask}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div
                onClick={() => onQuickAdd(category.name)}
                className="h-32 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors mb-1" />
                <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  Tambah tugas ke {category.name}
                </span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
