import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { TaskPriority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getDeadlineBadge(dateStr: string | null): {
  label: string;
  isOverdue: boolean;
  isNear: boolean;
} {
  if (!dateStr) return { label: "", isOverdue: false, isNear: false };
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      return { label: "Terlambat", isOverdue: true, isNear: false };
    }
    if (diffHours <= 24) {
      return { label: "Segera", isOverdue: false, isNear: true };
    }
    return { label: "", isOverdue: false, isNear: false };
  } catch {
    return { label: "", isOverdue: false, isNear: false };
  }
}

export const PRIORITY_STYLES: Record<
  TaskPriority,
  { label: string; badgeClass: string; dotClass: string }
> = {
  LOW: {
    label: "LOW",
    badgeClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
  },
  MEDIUM: {
    label: "MEDIUM",
    badgeClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60",
    dotClass: "bg-blue-500",
  },
  HIGH: {
    label: "HIGH",
    badgeClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    dotClass: "bg-amber-500",
  },
  URGENT: {
    label: "URGENT",
    badgeClass: "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
    dotClass: "bg-rose-500",
  },
};
