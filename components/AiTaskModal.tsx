"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Check, X, AlertCircle } from "lucide-react";
import { TaskPriority } from "@/lib/types";

interface AiTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

interface ParsedTaskState {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  deadline: string;
  tags: string[];
}

const EXAMPLE_PROMPTS = [
  "besok ada tugas basis data membuat ERD deadline jam 10 malam",
  "besok tugas pemrograman web landing page deadline jam 8 malam prioritas tinggi",
  "lusa kuis kalkulus bab integral jam 1 siang prioritas medium",
];

export default function AiTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: AiTaskModalProps) {
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step: "input" or "preview"
  const [step, setStep] = useState<"input" | "preview">("input");
  
  // Parsed Task state for preview & editing
  const [parsedTask, setParsedTask] = useState<ParsedTaskState>({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "General",
    deadline: "",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!promptText.trim()) {
      setError("Masukkan teks tugas terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptText.trim(),
          current_datetime: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses parsing tugas AI.");
      }

      const task = data.task;
      
      // Format deadline for <input type="datetime-local"> (YYYY-MM-DDTHH:mm)
      let formattedDeadline = "";
      if (task.deadline) {
        try {
          const d = new Date(task.deadline);
          // format local datetime for input
          const pad = (n: number) => n.toString().padStart(2, "0");
          formattedDeadline = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
          )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch {
          formattedDeadline = "";
        }
      }

      setParsedTask({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        category: task.category || "General",
        deadline: formattedDeadline,
        tags: Array.isArray(task.tags) ? task.tags : [],
      });

      setStep("preview");
    } catch (err: any) {
      setError(
        err.message ||
          "Gagal menghubungi service AI. Pastikan AI backend aktif di port 8001."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!parsedTask.tags.includes(newTag)) {
        setParsedTask((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setParsedTask((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const handleConfirmSave = async () => {
    if (!parsedTask.title.trim()) {
      setError("Judul tugas tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedTask.title.trim(),
          description: parsedTask.description.trim(),
          status: "BACKLOG",
          priority: parsedTask.priority,
          category: parsedTask.category.trim() || "General",
          deadline: parsedTask.deadline ? new Date(parsedTask.deadline).toISOString() : null,
          tags: parsedTask.tags,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menyimpan tugas ke database.");
      }

      // Success
      onTaskCreated();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPromptText("");
    setError(null);
    setStep("input");
    setParsedTask({
      title: "",
      description: "",
      priority: "MEDIUM",
      category: "General",
      deadline: "",
      tags: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                {step === "input" ? "Add Task with AI" : "Preview & Konfirmasi Tugas"}
              </h3>
              <p className="text-xs text-zinc-500">
                {step === "input"
                  ? "Tulis dalam bahasa alami, AI akan mengekstrak detail tugas."
                  : "Periksa dan edit hasil parsing AI sebelum disimpan ke board."}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === "input" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Input Bahasa Alami
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Contoh: besok ada tugas basis data membuat ERD dan deadline jam 10 malam..."
                  className="w-full text-sm p-3 bg-zinc-50 border border-zinc-200 rounded-lg placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                  autoFocus
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Contoh Prompt
                </span>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPromptText(ex)}
                      className="text-left text-xs text-zinc-600 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 px-2.5 py-1.5 rounded border border-zinc-200/80 transition-colors"
                    >
                      &gt; {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step Preview & Edit */
            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={parsedTask.title}
                  onChange={(e) =>
                    setParsedTask({ ...parsedTask, title: e.target.value })
                  }
                  className="w-full text-sm px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={2}
                  value={parsedTask.description}
                  onChange={(e) =>
                    setParsedTask({ ...parsedTask, description: e.target.value })
                  }
                  className="w-full text-sm p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={parsedTask.priority}
                    onChange={(e) =>
                      setParsedTask({
                        ...parsedTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full text-sm px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={parsedTask.category}
                    onChange={(e) =>
                      setParsedTask({ ...parsedTask, category: e.target.value })
                    }
                    className="w-full text-sm px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={parsedTask.deadline}
                  onChange={(e) =>
                    setParsedTask({ ...parsedTask, deadline: e.target.value })
                  }
                  className="w-full text-sm px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Tags (Tekan Enter untuk menambah)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {parsedTask.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Ketik tag lalu tekan Enter..."
                  className="w-full text-xs px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-50 border-t border-zinc-100">
          {step === "input" ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={isLoading || !promptText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Parse with AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("input")}
                className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors"
              >
                Ubah Input
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-lg shadow-2xs transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Task</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
