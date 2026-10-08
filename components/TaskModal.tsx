"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Loader2, AlertCircle, Layers, Image as ImageIcon, Upload } from "lucide-react";
import { BoardCategoryItem, TaskItem, TaskPriority } from "@/lib/types";

interface TaskModalProps {
  isOpen: boolean;
  taskToEdit?: TaskItem | null;
  initialCategory?: string;
  categories: BoardCategoryItem[];
  onClose: () => void;
  onSuccess: () => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({
  isOpen,
  taskToEdit,
  initialCategory,
  categories,
  onClose,
  onSuccess,
  onDelete,
}: TaskModalProps) {
  const isEditing = !!taskToEdit;

  const defaultCategory =
    initialCategory || (categories.length > 0 ? categories[0].name : "Umum");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [category, setCategory] = useState(defaultCategory);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category || defaultCategory);
      setIsCustomCategory(
        !categories.some((c) => c.name === taskToEdit.category)
      );
      setImageUrl(taskToEdit.imageUrl || null);
      setImageName(taskToEdit.imageUrl ? "Gambar terlampir" : null);
      setTags(taskToEdit.tags || []);

      if (taskToEdit.deadline) {
        try {
          const d = new Date(taskToEdit.deadline);
          const pad = (n: number) => n.toString().padStart(2, "0");
          setDeadline(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
              d.getDate()
            )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
          );
        } catch {
          setDeadline("");
        }
      } else {
        setDeadline("");
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setCategory(defaultCategory);
      setIsCustomCategory(false);
      setImageUrl(null);
      setImageName(null);
      setDeadline("");
      setTags([]);
    }
    setError(null);
    setIsConfirmingDelete(false);
  }, [taskToEdit, initialCategory, isOpen, categories, defaultCategory]);

  if (!isOpen) return null;

  const handleProcessImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar (PNG, JPG, WEBP, GIF).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setImageName(file.name);
      setError(null);
    };
    reader.onerror = () => {
      setError("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessImage(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleProcessImage(file);
          break;
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Judul tugas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category: category.trim() || defaultCategory,
        imageUrl: imageUrl || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        tags,
      };

      const url = isEditing ? `/api/tasks/${taskToEdit.id}` : "/api/tasks";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan tugas.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan tugas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92dvh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isEditing ? "Edit Tugas" : "Tambah Tugas Baru"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} onPaste={handlePaste} className="flex flex-col min-h-0 flex-1">
          <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 min-h-0">
            {error && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Judul Tugas <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Membuat ERD Database"
                className="w-full text-sm px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Deskripsi
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan atau rincian tugas..."
                className="w-full text-sm p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500 resize-none"
              />
            </div>

            {/* Category selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  Kategori Kolom
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
                >
                  {isCustomCategory ? "Pilih dari daftar" : "+ Kategori baru"}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ketik nama kategori baru..."
                  className="w-full text-sm px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {!categories.some((c) => c.name === category) && (
                    <option value={category}>{category}</option>
                  )}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-sm px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-sm px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Tags (Tekan Enter untuk menambah)
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
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
                placeholder="Ketik tag lalu tekan Enter..."
                className="w-full text-xs px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg focus:outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-500"
              />
            </div>

            {/* Image Attachment (Lampiran Gambar / Foto / Jadwal) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Lampiran Gambar / Jadwal</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
                >
                  {imageUrl ? "Ganti Gambar" : "+ Unggah / Pilih File"}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imageUrl ? (
                <div className="relative p-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center gap-3">
                  <img
                    src={imageUrl}
                    alt="Preview lampiran"
                    className="w-14 h-14 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0 bg-white dark:bg-zinc-900"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {imageName || "Gambar Terlampir"}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Tersimpan pada kartu tugas & dapat diperbesar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Hapus gambar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 rounded-xl p-3 text-center cursor-pointer transition-colors group flex flex-col items-center justify-center gap-1"
                >
                  <Upload className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                    Klik untuk unggah gambar atau tempel (<strong>Ctrl+V</strong>)
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Mendukung screenshot jadwal, tugas, atau catatan (PNG, JPG, WEBP)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            {isEditing && onDelete ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400 font-medium">Hapus?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(taskToEdit.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs cursor-pointer touch-manipulation"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors cursor-pointer touch-manipulation"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 disabled:opacity-50 rounded-lg shadow-2xs transition-colors cursor-pointer touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
