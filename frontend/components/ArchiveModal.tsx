"use client";

import React, { useState, useEffect } from "react";
import {
  Archive,
  X,
  RotateCcw,
  Trash2,
  Search,
  Calendar,
  AlertCircle,
  Loader2,
  Inbox,
} from "lucide-react";
import { TaskItem } from "@/lib/types";
import { formatDeadline, PRIORITY_STYLES } from "@/lib/utils";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export default function ArchiveModal({
  isOpen,
  onClose,
  onRestored,
}: ArchiveModalProps) {
  const [archivedTasks, setArchivedTasks] = useState<TaskItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchArchivedTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks?isArchived=true");
      if (!res.ok) throw new Error("Gagal mengambil data arsip");
      const data = await res.json();
      setArchivedTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat tugas terarsip.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchArchivedTasks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });
      if (!res.ok) throw new Error("Gagal memulihkan tugas");

      setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
      onRestored();
    } catch (err: any) {
      alert(err.message || "Gagal memulihkan tugas");
    }
  };

  const handlePermanentDelete = async (taskId: string) => {
    if (!confirm("Hapus permanen tugas ini dari database?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus tugas");

      setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId));
      onRestored();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus tugas");
    }
  };

  const filteredTasks = archivedTasks.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q) ||
      (t.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90dvh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Arsip Tugas
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 truncate">
                Daftar tugas yang diarsipkan ({archivedTasks.length} tugas)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas di arsip..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 sm:space-y-3 min-h-0">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-xs">Memuat arsip...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Tidak ada tugas yang diarsipkan
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Gunakan ikon arsip pada kartu board untuk memindahkan tugas ke sini.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const priorityInfo =
                PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;

              return (
                <div
                  key={task.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 sm:p-3.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 break-words">
                        {task.title}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${priorityInfo.badgeClass}`}
                      >
                        {priorityInfo.label}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded font-medium">
                        {task.category}
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDeadline(task.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => handleRestore(task.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer touch-manipulation"
                      title="Pulihkan tugas kembali ke board aktif"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(task.id)}
                      className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer touch-manipulation"
                      title="Hapus permanen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer touch-manipulation"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
