"use client";

import React, { useState, useRef } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { BoardCategoryItem, TaskPriority } from "@/lib/types";

interface AiSidebarProps {
  categories: BoardCategoryItem[];
  onTaskCreated: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface ExtractedSubTask {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  deadline?: string | null;
  tags: string[];
  selected?: boolean;
}

interface ParsedTaskState {
  title: string;
  description: string;
  priority: TaskPriority;
  category: string;
  deadline: string;
  tags: string[];
  imageUrl?: string | null;
  multiple_tasks?: ExtractedSubTask[];
  model_used?: string;
}

const EXAMPLE_PROMPTS = [
  "besok ada tugas basis data membuat ERD deadline jam 10 malam",
  "besok tugas pemrograman web landing page deadline jam 8 malam prioritas tinggi",
  "lusa kuis kalkulus bab turunan jam 1 siang prioritas medium",
];

export default function AiSidebar({
  categories,
  onTaskCreated,
  isOpen,
  onToggle,
}: AiSidebarProps) {
  const [promptText, setPromptText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multimodal image state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);

  // Parsed result preview
  const [parsedTask, setParsedTask] = useState<ParsedTaskState | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Handle file selection
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG, JPG, WEBP, GIF).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setSelectedImageName(file.name);
      setSelectedImageMime(file.type);
      setError(null);
    };
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedImageName(null);
    setSelectedImageMime(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Support paste image from clipboard (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          break;
        }
      }
    }
  };

  // Support drag & drop image onto the textarea
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processImageFile(file);
    }
  };

  const handleParse = async () => {
    if (!promptText.trim() && !selectedImage) {
      setError("Ketik teks instruksi atau lampirkan gambar tugas terlebih dahulu.");
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
          image_base64: selectedImage || null,
          image_mime_type: selectedImageMime || "image/jpeg",
          current_datetime: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses parsing tugas AI.");
      }

      const task = data.task;

      // Format deadline for input
      let formattedDeadline = "";
      if (task.deadline) {
        try {
          const d = new Date(task.deadline);
          const pad = (n: number) => n.toString().padStart(2, "0");
          formattedDeadline = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
          )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch {
          formattedDeadline = "";
        }
      }

      // Match with existing categories if possible, or use AI parsed category
      let targetCategory = task.category || "Umum";
      const matched = categories.find(
        (c) => c.name.toLowerCase() === targetCategory.toLowerCase()
      );
      if (matched) {
        targetCategory = matched.name;
      } else if (categories.length > 0 && (!targetCategory || targetCategory === "General")) {
        targetCategory = categories[0].name;
      }

      const multiple_tasks: ExtractedSubTask[] = Array.isArray(task.multiple_tasks)
        ? task.multiple_tasks.map((st: any) => ({
            title: st.title || "",
            description: st.description || "",
            priority: (st.priority || "MEDIUM") as TaskPriority,
            category: st.category || targetCategory,
            deadline: st.deadline || null,
            tags: Array.isArray(st.tags) ? st.tags : [],
            selected: true,
          }))
        : [];

      setParsedTask({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        category: targetCategory,
        deadline: formattedDeadline,
        tags: Array.isArray(task.tags) ? task.tags : [],
        imageUrl: selectedImage || null,
        multiple_tasks,
        model_used: task.model_used,
      });
    } catch (err: any) {
      setError(
        err.message ||
          "Gagal menghubungi service AI di port 8001. Pastikan AI backend aktif."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim() && parsedTask) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!parsedTask.tags.includes(newTag)) {
        setParsedTask({
          ...parsedTask,
          tags: [...parsedTask.tags, newTag],
        });
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!parsedTask) return;
    setParsedTask({
      ...parsedTask,
      tags: parsedTask.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSaveToBoard = async () => {
    if (!parsedTask || !parsedTask.title.trim()) {
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
          priority: parsedTask.priority,
          category: parsedTask.category.trim() || (categories[0]?.name ?? "Umum"),
          imageUrl: parsedTask.imageUrl || selectedImage || null,
          deadline: parsedTask.deadline ? new Date(parsedTask.deadline).toISOString() : null,
          tags: parsedTask.tags,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal menyimpan tugas.");
      }

      // Success
      setPromptText("");
      handleRemoveImage();
      setParsedTask(null);
      onTaskCreated();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan tugas ke board.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportBatchTasks = async () => {
    if (!parsedTask?.multiple_tasks) return;
    const selected = parsedTask.multiple_tasks.filter((t) => t.selected !== false);
    if (selected.length === 0) {
      setError("Pilih minimal 1 tugas atau mata kuliah untuk diimpor.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      for (const item of selected) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title.trim(),
            description: item.description?.trim() || "",
            priority: item.priority || "MEDIUM",
            category: item.category?.trim() || parsedTask.category || "Kuliah",
            imageUrl: selectedImage || null,
            deadline: item.deadline ? new Date(item.deadline).toISOString() : null,
            tags: item.tags || [],
          }),
        });
      }

      setPromptText("");
      handleRemoveImage();
      setParsedTask(null);
      onTaskCreated();
    } catch (err: any) {
      setError(err.message || "Gagal mengimpor tugas ke board.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <>
        {/* Desktop Toggle Button */}
        <button
          onClick={onToggle}
          className="hidden md:flex fixed left-4 bottom-6 z-40 items-center gap-2 px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all text-xs font-medium cursor-pointer"
          title="Buka AI Assistant Sidebar"
        >
          <Sparkles className="w-4 h-4 text-purple-400 dark:text-purple-600" />
          <span>Buka AI Assistant</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>

        {/* Mobile Floating Action Button (FAB) */}
        <button
          onClick={onToggle}
          className="md:hidden fixed right-4 bottom-5 z-20 flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-900/30 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
          title="Buka AI Assistant"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Task</span>
        </button>
      </>
    );
  }

  const sidebarBody = (
    <div className="w-full h-full bg-white dark:bg-zinc-900 flex flex-col select-none transition-colors">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              AI Task Assistant
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Input teks & gambar ke board
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Tutup Panel AI"
        >
          <X className="w-4 h-4 md:hidden" />
          <ChevronLeft className="w-4 h-4 hidden md:block" />
        </button>
      </div>

      {/* Sidebar Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        
        {/* Error Alert */}
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Box with Image attachment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Instruksi / Lampiran
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:underline cursor-pointer"
              title="Unggah screenshot atau foto tugas"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Lampirkan Foto</span>
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            className="relative"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onPaste={handlePaste}
              placeholder="Ketik tugas atau tempel/paste (Ctrl+V) screenshot soal/tugas di sini..."
              className="w-full text-xs p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Attached Image Thumbnail Preview */}
          {selectedImage && (
            <div className="relative mt-2 p-2 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 rounded-xl flex items-center gap-2.5 animate-in fade-in">
              <img
                src={selectedImage}
                alt="Lampiran gambar"
                className="w-11 h-11 object-cover rounded-lg border border-purple-200 dark:border-purple-800 shrink-0 bg-white dark:bg-zinc-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {selectedImageName || "Foto Terlampir"}
                </p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                  Gambar siap dianalisis Gemini Multimodal
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                title="Hapus lampiran gambar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleParse}
            disabled={isLoading || (!promptText.trim() && !selectedImage)}
            className="w-full mt-2 py-2.5 px-3 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menganalisis Teks & Gambar...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Proses dengan AI</span>
              </>
            )}
          </button>
        </div>

        {/* Example prompts */}
        {!parsedTask && (
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
              Contoh Prompt Cepat
            </span>
            <div className="space-y-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPromptText(ex)}
                  className="w-full text-left text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
                >
                  &gt; {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Parsed Preview & Editor */}
        {parsedTask && (
          <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/40 pb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1">
                  <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  Hasil AI
                </span>
                {parsedTask.model_used && (
                  <span className="text-[9px] font-mono font-medium text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-900/60 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                    ⚡ {parsedTask.model_used}
                  </span>
                )}
              </div>
              <button
                onClick={() => setParsedTask(null)}
                className="text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Judul Tugas
              </label>
              <input
                type="text"
                value={parsedTask.title}
                onChange={(e) =>
                  setParsedTask({ ...parsedTask, title: e.target.value })
                }
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Deskripsi
              </label>
              <textarea
                rows={2}
                value={parsedTask.description}
                onChange={(e) =>
                  setParsedTask({ ...parsedTask, description: e.target.value })
                }
                className="w-full text-xs p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                Kategori Kolom Board
              </label>
              <select
                value={parsedTask.category}
                onChange={(e) =>
                  setParsedTask({ ...parsedTask, category: e.target.value })
                }
                className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                {!categories.some((c) => c.name === parsedTask.category) && (
                  <option value={parsedTask.category}>
                    + {parsedTask.category} (Kategori Baru)
                  </option>
                )}
              </select>
            </div>

            {/* Priority & Deadline */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                  className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={parsedTask.deadline}
                  onChange={(e) =>
                    setParsedTask({ ...parsedTask, deadline: e.target.value })
                  }
                  className="w-full text-[11px] px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {parsedTask.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[10px] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-600 dark:hover:text-rose-400"
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
                placeholder="Tambah tag lalu Enter..."
                className="w-full text-[11px] px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Attached Image Indicator */}
            {parsedTask.imageUrl && (
              <div className="flex items-center gap-2.5 p-2 bg-purple-100/60 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <img
                  src={parsedTask.imageUrl}
                  alt="Lampiran"
                  className="w-10 h-10 object-cover rounded-md border border-purple-300 dark:border-purple-700 shrink-0 bg-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-purple-900 dark:text-purple-200 truncate">
                    Foto / Jadwal Terlampir
                  </p>
                  <p className="text-[10px] text-purple-600 dark:text-purple-400">
                    Akan ditampilkan pada cover kartu tugas
                  </p>
                </div>
              </div>
            )}

            {/* Multiple Tasks / Schedule Items List */}
            {parsedTask.multiple_tasks && parsedTask.multiple_tasks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-purple-200/60 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    Mata Kuliah / Tugas Terdeteksi ({parsedTask.multiple_tasks.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allSelected = parsedTask.multiple_tasks?.every((t) => t.selected !== false);
                      setParsedTask({
                        ...parsedTask,
                        multiple_tasks: parsedTask.multiple_tasks?.map((t) => ({ ...t, selected: !allSelected })),
                      });
                    }}
                    className="text-[10px] text-purple-700 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {parsedTask.multiple_tasks.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer text-xs hover:border-purple-300 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={(e) => {
                          const updated = [...(parsedTask.multiple_tasks || [])];
                          updated[idx] = { ...item, selected: e.target.checked };
                          setParsedTask({ ...parsedTask, multiple_tasks: updated });
                        }}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800 shrink-0">
                            {item.category}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleImportBatchTasks}
                  disabled={isSaving}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Impor {parsedTask.multiple_tasks.filter((t) => t.selected !== false).length} Jadwal ke Board Sekaligus
                  </span>
                </button>
              </div>
            )}

            {/* Confirm button */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedTask(null)}
                className="flex-1 py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveToBoard}
                disabled={isSaving}
                className="flex-1 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-50 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan 1 Tugas</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Inline Left Sidebar */}
      <aside className="hidden md:flex w-80 lg:w-88 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col shrink-0 select-none shadow-xs z-20 transition-colors">
        {sidebarBody}
      </aside>

      {/* Mobile: Full-height Slide-over Overlay Drawer */}
      <div className="md:hidden fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        />

        {/* Drawer Container */}
        <div className="relative w-[88vw] max-w-sm h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
          {sidebarBody}
        </div>
      </div>
    </>
  );
}
