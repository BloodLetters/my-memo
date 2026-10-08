"use client";

import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Calendar, Trash2, Edit3, GripVertical, Archive, Maximize2, X, Download, Image as ImageIcon } from "lucide-react";
import { TaskItem } from "@/lib/types";
import { formatDeadline, getDeadlineBadge, PRIORITY_STYLES } from "@/lib/utils";

interface TaskCardProps {
  task: TaskItem;
  index: number;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  index,
  onEdit,
  onDelete,
  onArchive,
}: TaskCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM;
  const deadlineBadge = getDeadlineBadge(task.deadline);

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative bg-white dark:bg-zinc-900 border rounded-lg p-3.5 transition-all select-none ${
            snapshot.isDragging
              ? "shadow-lg border-zinc-400 dark:border-zinc-600 rotate-1 ring-2 ring-zinc-900/10 dark:ring-white/10 cursor-grabbing"
              : "border-zinc-200/90 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs shadow-2xs cursor-grab"
          }`}
        >
          {/* Card Top: Drag handle & Action Buttons */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div
              {...provided.dragHandleProps}
              className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors pt-0.5 cursor-grab active:cursor-grabbing"
              title="Tahan untuk menggeser kartu"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1">
              <h4
                onClick={() => onEdit(task)}
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer transition-colors break-words"
              >
                {task.title}
              </h4>
            </div>

            {/* Quick Actions (visible on hover or always on touch/mobile, or when confirming delete) */}
            <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.5 rounded text-[10px]">
                  <span className="text-rose-700 dark:text-rose-300 font-medium">Hapus?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    className="text-rose-700 dark:text-rose-300 font-bold hover:underline cursor-pointer touch-manipulation"
                  >
                    Ya
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(false);
                    }}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-0.5 cursor-pointer touch-manipulation"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onArchive) onArchive(task.id);
                    }}
                    className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer touch-manipulation"
                    title="Arsipkan tugas ini"
                    aria-label="Arsipkan tugas"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                    className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer touch-manipulation"
                    title="Edit tugas"
                    aria-label="Edit tugas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsConfirmingDelete(true);
                    }}
                    className="p-1.5 sm:p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer touch-manipulation"
                    title="Hapus tugas"
                    aria-label="Hapus tugas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Attached Image Preview / Card Cover */}
          {task.imageUrl && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="relative w-full h-32 mb-2.5 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 group/cover cursor-pointer shadow-2xs"
              title="Klik untuk memperbesar gambar"
            >
              <img
                src={task.imageUrl}
                alt={task.title}
                className="w-full h-full object-cover object-top group-hover/cover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover/cover:opacity-100 pointer-events-none">
                <span className="text-[10px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                  <Maximize2 className="w-3 h-3" />
                  Lihat Gambar
                </span>
              </div>
            </div>
          )}

          {/* Description Preview if exists */}
          {task.description && (
            <p
              onClick={() => onEdit(task)}
              className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2.5 cursor-pointer leading-relaxed"
            >
              {task.description}
            </p>
          )}

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {task.category && (
              <span className="inline-flex items-center text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100/90 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700">
                {task.category}
              </span>
            )}
            {task.imageUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                <ImageIcon className="w-2.5 h-2.5" />
                Foto
              </span>
            )}
            {task.tags &&
              task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60"
                >
                  #{tag}
                </span>
              ))}
          </div>

          {/* Card Footer: Priority & Deadline */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${priorityInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dotClass}`} />
              {priorityInfo.label}
            </span>

            {/* Deadline */}
            {task.deadline ? (
              <div
                className={`inline-flex items-center gap-1 text-[11px] ${
                  deadlineBadge.isOverdue
                    ? "text-rose-600 dark:text-rose-400 font-medium"
                    : deadlineBadge.isNear
                    ? "text-amber-600 dark:text-amber-400 font-medium"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
                title={`Deadline: ${formatDeadline(task.deadline)}`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDeadline(task.deadline)}</span>
                {deadlineBadge.isOverdue && (
                  <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-1 py-0.2 rounded font-semibold border border-rose-200 dark:border-rose-800">
                    Lewat
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-zinc-300 dark:text-zinc-600">Tanpa deadline</span>
            )}
          </div>
        </div>
      )}
    </Draggable>

    {/* Fullscreen Image Lightbox Modal */}
    {isLightboxOpen && task.imageUrl && (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsLightboxOpen(false);
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in select-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-4xl w-full max-h-[92vh] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0 mr-3">
              <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-xs font-semibold truncate">
                {task.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={task.imageUrl}
                download={`memo_${task.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Unduh Gambar"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div className="p-3 sm:p-4 overflow-auto max-h-[82vh] flex items-center justify-center bg-zinc-950/80">
            <img
              src={task.imageUrl}
              alt={task.title}
              className="max-w-full max-h-[76vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    )}
  </>
  );
}
