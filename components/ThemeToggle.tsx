"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const emptySubscribe = () => () => {};
const useMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      data-testid="theme-toggle"
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/60 rounded-lg transition-all cursor-pointer ${className}`}
      title={isDark ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
      aria-label="Toggle dark mode"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-medium">
          {isDark ? "Mode Terang" : "Mode Gelap"}
        </span>
      )}
    </button>
  );
}
